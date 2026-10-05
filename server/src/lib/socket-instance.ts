import type { Server } from 'socket.io';

let io: Server | null = null;

export function setSocketInstance(socketServer: Server) {
  io = socketServer;
}

export function getSocketInstance(): Server {
  if (!io) {
    throw new Error('Socket.IO server is not initialized');
  }

  return io;
}