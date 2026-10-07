import { prisma } from '../../lib/prisma.js';
import { getSocketInstance } from '../../lib/socket-instance.js';
import { emitProjectEvent } from '../../lib/socket-events.js';
import { createActivityLog } from '../activity-logs/activity-log.service.js';

import type {
  CreateCommentInput,
  UpdateCommentInput,
} from './comment.schema.js';

type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export async function createComment(
  userId: string,
  userRole: UserRole,
  taskId: string,
  input: CreateCommentInput,
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        select: {
          id: true,
          ownerId: true,
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
      assignee: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (userRole !== 'ADMIN') {
    const isOwner =
      task.project.ownerId === userId;

    const isMember =
      task.project.members.some(
        (member) => member.userId === userId,
      );

    const isAssignee =
      task.assignee?.id === userId;

    if (
      !isOwner &&
      !isMember &&
      !isAssignee
    ) {
      throw new Error(
        'You do not have access to this task',
      );
    }
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: userId,
      content: input.content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  await createActivityLog({
    projectId: task.project.id,
    taskId: task.id,
    actorId: userId,
    action: 'COMMENT_CREATED',
    metadata: {
      commentId: comment.id,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    task.project.id,
    'comment:created',
    comment,
  );

  return comment;
}

export async function getComments(
  userId: string,
  userRole: UserRole,
  taskId: string,
) {
  const task = await prisma.task.findUnique({
    where: {
      id: taskId,
    },
    include: {
      project: {
        select: {
          ownerId: true,
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
      assignee: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (userRole !== 'ADMIN') {
    const isOwner =
      task.project.ownerId === userId;

    const isMember =
      task.project.members.some(
        (member) => member.userId === userId,
      );

    const isAssignee =
      task.assignee?.id === userId;

    if (!isOwner && !isMember && !isAssignee) {
      throw new Error(
        'You do not have access to this task',
      );
    }
  }

  return prisma.comment.findMany({
    where: {
      taskId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateComment(
  userId: string,
  userRole: UserRole,
  commentId: string,
  input: UpdateCommentInput,
) {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      task: {
        select: {
          id: true,
          projectId: true,
          assigneeId: true,
          project: {
            select: {
              ownerId: true,
              members: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (userRole !== 'ADMIN') {
    const isOwner =
      comment.task.project.ownerId === userId;

    const isMember =
      comment.task.project.members.some(
        (member) => member.userId === userId,
      );

    const isAssignee =
      comment.task.assigneeId === userId;

    const isAuthor =
      comment.authorId === userId;

    if (
      !isOwner &&
      !isMember &&
      !isAssignee
    ) {
      throw new Error(
        'You do not have access to this task',
      );
    }

    if (!isAuthor) {
      throw new Error(
        'You can only update your own comments',
      );
    }
  }

  const updatedComment =
    await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: input.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  await createActivityLog({
    projectId: comment.task.projectId,
    taskId: comment.task.id,
    actorId: userId,
    action: 'COMMENT_UPDATED',
    metadata: {
      commentId: comment.id,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    comment.task.projectId,
    'comment:updated',
    updatedComment,
  );

  return updatedComment;
}

export async function deleteComment(
  userId: string,
  userRole: UserRole,
  commentId: string,
) {
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    include: {
      task: {
        select: {
          id: true,
          projectId: true,
          assigneeId: true,
          project: {
            select: {
              ownerId: true,
              members: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (userRole !== 'ADMIN') {
    const isOwner =
      comment.task.project.ownerId === userId;

    const isMember =
      comment.task.project.members.some(
        (member) => member.userId === userId,
      );

    const isAssignee =
      comment.task.assigneeId === userId;

    const isAuthor =
      comment.authorId === userId;

    if (
      !isOwner &&
      !isMember &&
      !isAssignee
    ) {
      throw new Error(
        'You do not have access to this task',
      );
    }

    if (!isAuthor) {
      throw new Error(
        'You can only delete your own comments',
      );
    }
  }

  await createActivityLog({
    projectId: comment.task.projectId,
    taskId: comment.task.id,
    actorId: userId,
    action: 'COMMENT_DELETED',
    metadata: {
      commentId: comment.id,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    comment.task.projectId,
    'comment:deleted',
    {
      commentId: comment.id,
      taskId: comment.task.id,
      projectId: comment.task.projectId,
    },
  );

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });
}