import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/game';

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'],
});
