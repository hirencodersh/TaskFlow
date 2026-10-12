import { prisma } from '../../lib/prisma.js';
import { getSocketInstance } from '../../lib/socket-instance.js';
import { logger } from '../../lib/logger.js';

export async function createNotification(input: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        link: input.link,
      },
    });

    const io = getSocketInstance();
    if (io) {
      io.to(`user:${input.userId}`).emit('notification:new', notification);
    }

    return notification;
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function getNotifications(
  userId: string,
  query: { unreadOnly?: boolean; page: number; limit: number },
) {
  const { unreadOnly, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return true;
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error('Notification not found');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return true;
}
