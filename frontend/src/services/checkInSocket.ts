import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../constants';
import { CheckInSocketPayload } from '../types';

type Role = 'STAFF' | 'MANAGER' | 'ADMIN';

let socket: Socket | null = null;
const listeners = new Set<(payload: CheckInSocketPayload) => void>();
let joinedRole: Role | null = null;
let joinedEmployeeId: string | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_ORIGIN, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('checkin:update', (payload: CheckInSocketPayload) => {
      listeners.forEach((listener) => listener(payload));
    });

    socket.on('connect', () => {
      if (joinedRole === 'MANAGER' || joinedRole === 'ADMIN') {
        socket?.emit('join', 'managers');
      }
      if (joinedRole === 'STAFF' && joinedEmployeeId) {
        socket?.emit('join', `staff:${joinedEmployeeId}`);
      }
    });
  }
  return socket;
}

function joinRooms(role: Role, employeeId?: string) {
  joinedRole = role;
  joinedEmployeeId = employeeId ?? null;
  const client = getSocket();
  if (!client.connected) return;
  if (role === 'MANAGER' || role === 'ADMIN') {
    client.emit('join', 'managers');
  }
  if (role === 'STAFF' && employeeId) {
    client.emit('join', `staff:${employeeId}`);
  }
}

export function connectCheckInSocket(options: {
  role: Role;
  employeeId?: string;
  onUpdate: (payload: CheckInSocketPayload) => void;
}) {
  getSocket();
  joinRooms(options.role, options.employeeId);
  listeners.add(options.onUpdate);

  return () => {
    listeners.delete(options.onUpdate);
  };
}
