import { prisma } from '../../lib/prisma.js';
import { createActivityLog } from '../activity-logs/activity-log.service.js';
import { getSocketInstance } from '../../lib/socket-instance.js';
import { emitProjectEvent } from '../../lib/socket-events.js';

import type {
  CreateLabelInput,
  UpdateLabelInput,
} from './label.schema.js';

type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER';

async function getProjectAccess(
  userId: string,
  userRole: UserRole,
  projectId: string,
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
      tasks: {
        where: {
          assigneeId: userId,
        },
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  if (userRole === 'ADMIN') {
    return project;
  }

  const isOwner =
    project.ownerId === userId;

  const isMember =
    project.members.some(
      (member) => member.userId === userId,
    );

  const isAssignee =
    project.tasks.length > 0;

  if (
    !isOwner &&
    !isMember &&
    !isAssignee
  ) {
    throw new Error(
      'You do not have access to this project',
    );
  }

  return project;
}

export async function createLabel(
  userId: string,
  userRole: UserRole,
  input: CreateLabelInput,
) {
  const project = await getProjectAccess(
    userId,
    userRole,
    input.projectId,
  );

  if (
    userRole !== 'ADMIN' &&
    project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can create labels',
    );
  }

  const existingLabel =
    await prisma.label.findFirst({
      where: {
        projectId: input.projectId,
        name: input.name,
      },
    });

  if (existingLabel) {
    throw new Error(
      'A label with this name already exists in the project',
    );
  }

  const label = await prisma.label.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      color: input.color,
    },
  });

  await createActivityLog({
    projectId: label.projectId,
    actorId: userId,
    action: 'LABEL_CREATED',
    metadata: {
      labelId: label.id,
      labelName: label.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    label.projectId,
    'label:created',
    label,
  );

  return label;
}

export async function getLabels(
  userId: string,
  userRole: UserRole,
  projectId: string,
) {
  await getProjectAccess(
    userId,
    userRole,
    projectId,
  );

  return prisma.label.findMany({
    where: {
      projectId,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function updateLabel(
  userId: string,
  userRole: UserRole,
  labelId: string,
  input: UpdateLabelInput,
) {
  const label = await prisma.label.findUnique({
    where: {
      id: labelId,
    },
    include: {
      project: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!label) {
    throw new Error('Label not found');
  }

  if (
    userRole !== 'ADMIN' &&
    label.project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can update labels',
    );
  }

  if (input.name) {
    const existingLabel =
      await prisma.label.findFirst({
        where: {
          projectId: label.projectId,
          name: input.name,
          NOT: {
            id: labelId,
          },
        },
      });

    if (existingLabel) {
      throw new Error(
        'A label with this name already exists in the project',
      );
    }
  }

  const updatedLabel =
    await prisma.label.update({
      where: {
        id: labelId,
      },
      data: {
        ...input,
      },
    });

  await createActivityLog({
    projectId: updatedLabel.projectId,
    actorId: userId,
    action: 'LABEL_UPDATED',
    metadata: {
      labelId: updatedLabel.id,
      changes: input,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    updatedLabel.projectId,
    'label:updated',
    updatedLabel,
  );

  return updatedLabel;
}

export async function deleteLabel(
  userId: string,
  userRole: UserRole,
  labelId: string,
) {
  const label = await prisma.label.findUnique({
    where: {
      id: labelId,
    },
    include: {
      project: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!label) {
    throw new Error('Label not found');
  }

  if (
    userRole !== 'ADMIN' &&
    label.project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can delete labels',
    );
  }

  await createActivityLog({
    projectId: label.projectId,
    actorId: userId,
    action: 'LABEL_DELETED',
    metadata: {
      labelId: label.id,
      labelName: label.name,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    label.projectId,
    'label:deleted',
    {
      labelId: label.id,
      projectId: label.projectId,
      name: label.name,
    },
  );

  await prisma.label.delete({
    where: {
      id: labelId,
    },
  });
}