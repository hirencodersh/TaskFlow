import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001';

export const socket: Socket = io(
  SOCKET_URL,
  {
    autoConnect: false,
    withCredentials: true,
  },
);

export function connectSocket(
  accessToken: string,
) {
  socket.auth = {
    token: accessToken,
  };

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export function joinProject(
  projectId: string,
) {
  if (!socket.connected) {
    return;
  }

  socket.emit(
    'join-project',
    projectId,
  );
}

export function leaveProject(
  projectId: string,
) {
  if (!socket.connected) {
    return;
  }

  socket.emit(
    'leave-project',
    projectId,
  );
}