import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../constants';
import { CheckInSocketPayload } from '../types';

let socket: Socket | null = null;

export function getCheckInSocket(): Socket {
  if (!socket) {
    socket = io(API_ORIGIN, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectCheckInSocket(options: {
  role: 'STAFF' | 'MANAGER' | 'ADMIN';
  employeeId?: string;
  onUpdate: (payload: CheckInSocketPayload) => void;
}) {
  const client = getCheckInSocket();

  const handleUpdate = (payload: CheckInSocketPayload) => {
    options.onUpdate(payload);
  };

  client.off('checkin:update', handleUpdate);
  client.on('checkin:update', handleUpdate);

  if (!client.connected) {
    client.connect();
  }

  client.once('connect', () => {
    if (options.role === 'MANAGER' || options.role === 'ADMIN') {
      client.emit('join', 'managers');
    }
    if (options.role === 'STAFF' && options.employeeId) {
      client.emit('join', `staff:${options.employeeId}`);
    }
  });

  if (client.connected) {
    if (options.role === 'MANAGER' || options.role === 'ADMIN') {
      client.emit('join', 'managers');
    }
    if (options.role === 'STAFF' && options.employeeId) {
      client.emit('join', `staff:${options.employeeId}`);
    }
  }

  return () => {
    client.off('checkin:update', handleUpdate);
  };
}
