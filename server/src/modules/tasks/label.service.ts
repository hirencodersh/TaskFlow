import { prisma } from '../../lib/prisma.js';

type UserRole =
    | 'ADMIN'
    | 'PROJECT_MANAGER'
    | 'DEVELOPER';

export async function createLabel(
    userId: string,
    userRole: UserRole,
    projectId: string,
    name: string,
    color: string,
) {
    if (userRole === 'DEVELOPER') {
        throw new Error(
            'Developers cannot create labels',
        );
    }

    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
        },
        select: {
            id: true,
            ownerId: true,
        },
    });

    if (!project) {
        throw new Error('Project not found');
    }

    if (
        userRole !== 'ADMIN' &&
        project.ownerId !== userId
    ) {
        throw new Error(
            'Only the project owner or admin can create labels',
        );
    }

    const existingLabel =
        await prisma.label.findUnique({
            where: {
                projectId_name: {
                    projectId,
                    name,
                },
            },
        });

    if (existingLabel) {
        throw new Error(
            'A label with this name already exists in the project',
        );
    }

    return prisma.label.create({
        data: {
            projectId,
            name,
            color,
        },
    });
}

export async function getProjectLabels(
    userId: string,
    userRole: UserRole,
    projectId: string,
) {
    const project =
        await prisma.project.findUnique({
            where: {
                id: projectId,
            },
            select: {
                id: true,
                ownerId: true,
                members: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

    if (!project) {
        throw new Error('Project not found');
    }

    if (userRole !== 'ADMIN') {
        const isOwner =
            project.ownerId === userId;

        const isMember =
            project.members.some(
                (member) =>
                    member.userId === userId,
            );

        if (!isOwner && !isMember) {
            throw new Error(
                'You do not have access to this project',
            );
        }
    }

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
    name: string,
    color: string,
) {
    if (userRole === 'DEVELOPER') {
        throw new Error(
            'Developers cannot update labels',
        );
    }

    const label =
        await prisma.label.findUnique({
            where: {
                id: labelId,
            },
            include: {
                project: {
                    select: {
                        id: true,
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

    const duplicate =
        await prisma.label.findFirst({
            where: {
                projectId: label.projectId,
                name,
                NOT: {
                    id: labelId,
                },
            },
        });

    if (duplicate) {
        throw new Error(
            'A label with this name already exists in the project',
        );
    }

    return prisma.label.update({
        where: {
            id: labelId,
        },
        data: {
            name,
            color,
        },
    });
}

export async function deleteLabel(
    userId: string,
    userRole: UserRole,
    labelId: string,
) {
    if (userRole === 'DEVELOPER') {
        throw new Error(
            'Developers cannot delete labels',
        );
    }

    const label =
        await prisma.label.findUnique({
            where: {
                id: labelId,
            },
            include: {
                project: {
                    select: {
                        id: true,
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

    await prisma.label.delete({
        where: {
            id: labelId,
        },
    });
}

export async function assignLabelToTask(
  userId: string,
  userRole: UserRole,
  taskId: string,
  labelId: string,
) {
  if (userRole === 'DEVELOPER') {
    throw new Error(
      'Developers cannot assign labels',
    );
  }

  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

  if (!task) {
    throw new Error('Task not found');
  }

  if (
    userRole !== 'ADMIN' &&
    task.project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can assign labels',
    );
  }

  const label =
    await prisma.label.findUnique({
      where: {
        id: labelId,
      },
      select: {
        id: true,
        projectId: true,
      },
    });

  if (!label) {
    throw new Error('Label not found');
  }

  if (label.projectId !== task.projectId) {
    throw new Error(
      'Label does not belong to the task project',
    );
  }

  const existingTaskLabel =
    await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

  if (existingTaskLabel) {
    throw new Error(
      'Label is already assigned to this task',
    );
  }

  return prisma.taskLabel.create({
    data: {
      taskId,
      labelId,
    },
    include: {
      label: true,
    },
  });
}

export async function removeLabelFromTask(
  userId: string,
  userRole: UserRole,
  taskId: string,
  labelId: string,
) {
  if (userRole === 'DEVELOPER') {
    throw new Error(
      'Developers cannot remove labels',
    );
  }

  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

  if (!task) {
    throw new Error('Task not found');
  }

  if (
    userRole !== 'ADMIN' &&
    task.project.ownerId !== userId
  ) {
    throw new Error(
      'Only the project owner or admin can remove labels',
    );
  }

  const taskLabel =
    await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

  if (!taskLabel) {
    throw new Error(
      'Label is not assigned to this task',
    );
  }

  await prisma.taskLabel.delete({
    where: {
      taskId_labelId: {
        taskId,
        labelId,
      },
    },
  });
}