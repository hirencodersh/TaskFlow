import type { Server } from 'socket.io';

export function emitProjectEvent(
  io: Server,
  projectId: string,
  event: string,
  data: unknown,
) {
  io.to(`project:${projectId}`).emit(event, data);
}