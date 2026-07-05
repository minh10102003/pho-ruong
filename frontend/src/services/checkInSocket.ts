import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import { API_ORIGIN } from '../constants';
import { CheckInSocketPayload } from '../types';

type Role = 'STAFF' | 'MANAGER' | 'ADMIN';

const usePollingOnly = Platform.OS === 'web';

let socket: Socket | null = null;
const checkInListeners = new Set<(payload: CheckInSocketPayload) => void>();
const orderListeners = new Set<() => void>();
let joinedRole: Role | null = null;
let joinedEmployeeId: string | null = null;

function applyJoin(client: Socket) {
  client.emit('join', 'pos');
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
      transports: usePollingOnly ? ['polling'] : ['websocket', 'polling'],
      upgrade: !usePollingOnly,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socket.on('checkin:update', (payload: CheckInSocketPayload) => {
      checkInListeners.forEach((listener) => listener(payload));
    });

    socket.on('order:update', () => {
      orderListeners.forEach((listener) => listener());
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
  checkInListeners.add(options.onUpdate);

  return () => {
    checkInListeners.delete(options.onUpdate);
  };
}

export function subscribeOrderUpdates(onUpdate: () => void, role: Role) {
  ensureJoined(role);
  orderListeners.add(onUpdate);

  return () => {
    orderListeners.delete(onUpdate);
  };
}
