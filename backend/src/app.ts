import express from 'express';
import cors from 'cors';
import path from 'path';
import orderRoutes from './routes/order.routes';
import inventoryRoutes from './routes/inventory.routes';
import employeeRoutes from './routes/employee.routes';
import reportRoutes from './routes/report.routes';
import paymentRoutes from './routes/payment.routes';
import { errorHandler } from './middleware/validate';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pho-restaurant-api' });
});

// API routes
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payment', paymentRoutes);

app.use(errorHandler);

export default app;
