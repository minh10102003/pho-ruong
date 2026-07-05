import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

export type CheckInSocketAction = 'requested' | 'approved' | 'rejected' | 'cancelled';

export interface CheckInSocketPayload {
  action: CheckInSocketAction;
  requestId: string;
  employeeId: string;
  employeeName?: string;
  message?: string;
  timesheetId?: string;
}

class SocketHub {
  private io: Server | null = null;

  init(server: HttpServer): void {
    this.io = new Server(server, {
      cors: { origin: '*' },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      pingTimeout: 60_000,
      pingInterval: 25_000,
      allowUpgrades: true,
    });

    this.io.on('connection', (socket) => {
      socket.emit('connected', { message: 'Socket.IO kết nối thành công' });

      socket.on('join', (room: unknown) => {
        if (typeof room !== 'string') return;
        if (room === 'managers' || room === 'pos' || room.startsWith('staff:')) {
          socket.join(room);
        }
      });
    });
  }

  emitCheckInUpdate(payload: CheckInSocketPayload): void {
    if (!this.io) return;
    this.io.to('managers').emit('checkin:update', payload);
    this.io.to(`staff:${payload.employeeId}`).emit('checkin:update', payload);
  }

  emitOrderUpdate(payload: unknown): void {
    if (!this.io) return;
    this.io.to('pos').emit('order:update', payload);
  }
}

export const socketHub = new SocketHub();
