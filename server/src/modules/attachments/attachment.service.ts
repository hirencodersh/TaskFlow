import { Readable } from 'stream';

import { prisma } from '../../lib/prisma.js';
import cloudinary from '../../lib/cloudinary.js';

import { createActivityLog } from '../activity-logs/activity-log.service.js';

import { getSocketInstance } from '../../lib/socket-instance.js';
import { emitProjectEvent } from '../../lib/socket-events.js';

type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER';

export async function getTaskForAttachment(
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
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (userRole === 'ADMIN') {
    return task;
  }

  const isOwner =
    task.project.ownerId === userId;

  const isMember =
    task.project.members.some(
      (member) =>
        member.userId === userId,
    );

  if (!isOwner && !isMember) {
    throw new Error(
      'You do not have access to this task',
    );
  }

  return task;
}

export async function createAttachmentRecord(
  taskId: string,
  userId: string,
  fileData: {
    url: string;
    publicId: string;
    fileName: string;
    mimeType: string;
    size: number;
  },
) {
  const attachment =
    await prisma.attachment.create({
      data: {
        taskId,
        uploadedById: userId,
        url: fileData.url,
        publicId: fileData.publicId,
        fileName: fileData.fileName,
        mimeType: fileData.mimeType,
        size: fileData.size,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

  await createActivityLog({
    projectId: attachment.task.projectId,
    taskId: attachment.taskId,
    actorId: userId,
    action: 'ATTACHMENT_UPLOADED',
    metadata: {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    attachment.task.projectId,
    'attachment:uploaded',
    attachment,
  );

  return attachment;
}

export async function getAttachments(
  userId: string,
  userRole: UserRole,
  taskId: string,
) {
  await getTaskForAttachment(
    userId,
    userRole,
    taskId,
  );

  return prisma.attachment.findMany({
    where: {
      taskId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function uploadAttachmentToCloudinary(
  file: Express.Multer.File,
) {
  return new Promise<{
    url: string;
    publicId: string;
  }>((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder: 'taskflow/attachments',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              error ??
                new Error(
                  'Cloudinary upload failed',
                ),
            );
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

    Readable.from(file.buffer).pipe(
      uploadStream,
    );
  });
}

export async function deleteAttachment(
  userId: string,
  userRole: UserRole,
  attachmentId: string,
) {
  const attachment =
    await prisma.attachment.findUnique({
      where: {
        id: attachmentId,
      },
      include: {
        task: {
          include: {
            project: {
              select: {
                id: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

  if (!attachment) {
    throw new Error(
      'Attachment not found',
    );
  }

  const isAdmin =
    userRole === 'ADMIN';

  const isProjectOwner =
    attachment.task.project.ownerId ===
    userId;

  const isUploader =
    attachment.uploadedById === userId;

  if (
    !isAdmin &&
    !isProjectOwner &&
    !isUploader
  ) {
    throw new Error(
      'You do not have permission to delete this attachment',
    );
  }

  await cloudinary.uploader.destroy(
    attachment.publicId,
    {
      resource_type: 'raw',
    },
  );

  await createActivityLog({
    projectId: attachment.task.project.id,
    taskId: attachment.taskId,
    actorId: userId,
    action: 'ATTACHMENT_DELETED',
    metadata: {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
    },
  });

  const io = getSocketInstance();

  emitProjectEvent(
    io,
    attachment.task.project.id,
    'attachment:deleted',
    {
      attachmentId: attachment.id,
      taskId: attachment.taskId,
      projectId:
        attachment.task.project.id,
      fileName: attachment.fileName,
    },
  );

  await prisma.attachment.delete({
    where: {
      id: attachmentId,
    },
  });
}