import http from 'http';
import app from './app';
import { config } from './config';
import { orderWsHub } from './websocket/orderHub';

const server = http.createServer(app);

// Khởi tạo WebSocket cho cập nhật đơn hàng realtime
orderWsHub.init(server, config.wsPath);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`🍜 Pho Restaurant API đang chạy tại http://0.0.0.0:${config.port}`);
  console.log(`📡 Truy cập LAN: http://<IP-máy-tính>:${config.port}`);
  console.log(`📡 WebSocket: ws://0.0.0.0:${config.port}${config.wsPath}`);
});
