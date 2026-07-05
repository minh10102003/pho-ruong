import express from 'express';
import cors from 'cors';
import path from 'path';
import orderRoutes from './routes/order.routes';
import inventoryRoutes from './routes/inventory.routes';
import employeeRoutes from './routes/employee.routes';
import reportRoutes from './routes/report.routes';
import paymentRoutes from './routes/payment.routes';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/validate';
import { authenticate } from './middleware/auth';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pho-restaurant-api' });
});

// Auth (login public)
app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/employees', authenticate, employeeRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/payment', authenticate, paymentRoutes);

app.use(errorHandler);

export default app;
