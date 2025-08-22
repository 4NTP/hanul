'use client';

import { io, Socket } from 'socket.io-client';

export const socket: Socket = io(
  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001',
  {
    transports: ['websocket'],
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    withCredentials: true,
  },
);
