import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

export function setupSocket(io: Server) {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

      if (
        typeof decoded !== 'object' ||
        decoded === null ||
        typeof decoded.userId !== 'string'
      ) {
        return next(new Error('Invalid access token'));
      }

      const user = await prisma.user.findUnique({
        where: {
          id: decoded.userId,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.data.userId = user.id;
      socket.data.userRole = user.role;

      return next();
    } catch {
      return next(new Error('Invalid or expired access token'));
    }
  });

  // Socket connection
  io.on('connection', (socket) => {
    logger.info(
      `Socket connected: ${socket.id} user=${socket.data.userId}`,
    );

    // Join project room
    socket.on('join-project', async (projectId: string) => {
      try {
        if (!projectId || typeof projectId !== 'string') {
          return;
        }

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
          },
        });

        if (!project) {
          return;
        }

        const isAdmin = socket.data.userRole === 'ADMIN';

        const isOwner =
          project.ownerId === socket.data.userId;

        const isMember = project.members.some(
          (member) =>
            member.userId === socket.data.userId,
        );

        if (!isAdmin && !isOwner && !isMember) {
          logger.warn(
            `Unauthorized project room access: user=${socket.data.userId} project=${projectId}`,
          );

          return;
        }

        await socket.join(`project:${projectId}`);

        logger.info(
          `Socket ${socket.id} joined project:${projectId}`,
        );
      } catch (error) {
        logger.error(error);
      }
    });

    // Leave project room
    socket.on('leave-project', async (projectId: string) => {
      try {
        if (!projectId || typeof projectId !== 'string') {
          return;
        }

        await socket.leave(`project:${projectId}`);

        logger.info(
          `Socket ${socket.id} left project:${projectId}`,
        );
      } catch (error) {
        logger.error(error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(
        `Socket disconnected: ${socket.id} user=${socket.data.userId}`,
      );
    });
  });
}