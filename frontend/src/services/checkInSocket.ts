import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { API_ORIGIN } from '../constants';
import { CheckInSocketPayload } from '../types';

type Role = 'STAFF' | 'MANAGER' | 'ADMIN';

let socket: Socket | null = null;
const listeners = new Set<(payload: CheckInSocketPayload) => void>();
let joinedRole: Role | null = null;
let joinedEmployeeId: string | null = null;

function applyJoin(client: Socket) {
  if (joinedRole === 'MANAGER' || joinedRole === 'ADMIN') {
    client.emit('join', 'managers');
  }
  if (joinedRole === 'STAFF' && joinedEmployeeId) {
    client.emit('join', `staff:${joinedEmployeeId}`);
  }
}

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_ORIGIN, {
      path: '/socket.io',
      // Polling trước — ổn định hơn qua proxy Render/CDN; nâng cấp lên WS khi được.
      transports: Platform.OS === 'web' ? ['polling', 'websocket'] : ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socket.on('checkin:update', (payload: CheckInSocketPayload) => {
      listeners.forEach((listener) => listener(payload));
    });

    socket.on('connect', () => {
      applyJoin(socket!);
    });
  }
  return socket;
}

function ensureJoined(role: Role, employeeId?: string) {
  const nextEmployeeId = employeeId ?? null;

  if (joinedRole === role && joinedEmployeeId === nextEmployeeId) {
    const client = socket ?? getSocket();
    if (!client.connected) {
      client.connect();
    }
    return;
  }

  joinedRole = role;
  joinedEmployeeId = nextEmployeeId;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const client = getSocket();
  if (client.connected) {
    applyJoin(client);
  }
}

export function connectCheckInSocket(options: {
  role: Role;
  employeeId?: string;
  onUpdate: (payload: CheckInSocketPayload) => void;
}) {
  ensureJoined(options.role, options.employeeId);
  listeners.add(options.onUpdate);

  return () => {
    listeners.delete(options.onUpdate);
  };
}
