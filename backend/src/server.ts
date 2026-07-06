import http from 'http';
import app from './app';
import { config } from './config';
import { orderWsHub } from './websocket/orderHub';
import { socketHub } from './websocket/socketHub';
import { permissionService } from './services/permission.service';

const server = http.createServer(app);

orderWsHub.init(server, config.wsPath);
socketHub.init(server);

void permissionService.initDefaults().catch((err) => {
  console.error('Không thể khởi tạo phân quyền mặc định:', err);
});

server.listen(config.port, '0.0.0.0', () => {
  console.log(`🍜 Pho Restaurant API đang chạy tại http://0.0.0.0:${config.port}`);
  console.log(`📡 Truy cập LAN: http://<IP-máy-tính>:${config.port}`);
  console.log(`📡 WebSocket: ws://0.0.0.0:${config.port}${config.wsPath}`);
  console.log(`📡 Socket.IO: http://0.0.0.0:${config.port}/socket.io`);
});
