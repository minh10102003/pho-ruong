import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Quản lý WebSocket cho cập nhật trạng thái đơn hàng realtime
class OrderWebSocketHub {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(server: Server, path: string): void {
    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Kết nối WebSocket thành công' }));

      ws.on('close', () => this.clients.delete(ws));
      ws.on('error', () => this.clients.delete(ws));
    });
  }

  // Phát sự kiện cập nhật đơn hàng tới tất cả client
  broadcastOrderUpdate(payload: unknown): void {
    this.broadcast('ORDER_UPDATE', payload);
  }

  broadcastEmployeeUpdate(payload?: unknown): void {
    this.broadcast('EMPLOYEE_UPDATE', payload);
  }

  broadcastCheckInUpdate(payload: unknown): void {
    this.broadcast('CHECKIN_UPDATE', payload);
  }

  private broadcast(type: string, payload?: unknown): void {
    const message = JSON.stringify({ type, data: payload });
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

export const orderWsHub = new OrderWebSocketHub();
