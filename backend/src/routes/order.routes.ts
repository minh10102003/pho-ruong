import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireRoles } from '../middleware/auth';
import { orderController } from '../controllers/order.controller';

const router = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().positive(),
        selection: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .min(1),
  note: z.string().optional(),
  tableNumber: z.string().optional(),
});

const updateStatusSchema = z
  .object({
    status: z.enum(['PENDING', 'PREPARING', 'SERVED', 'PAID']),
    paymentMethod: z.enum(['CASH', 'TRANSFER']).optional(),
  })
  .refine((data) => data.status !== 'PAID' || data.paymentMethod != null, {
    message: 'Vui lòng chọn hình thức thanh toán',
    path: ['paymentMethod'],
  });

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['pho_size', 'side', 'drink']),
  imageUrl: z.string().min(1).optional(),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  category: z.enum(['pho_size', 'side', 'drink']).optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().min(1).nullable().optional(),
});

// Thực đơn
router.get('/menu', orderController.getMenu);
router.get('/menu/all', requireRoles('MANAGER', 'ADMIN'), orderController.getAllMenu);
router.post(
  '/menu',
  requireRoles('MANAGER', 'ADMIN'),
  validateBody(createMenuItemSchema),
  orderController.createMenuItem
);
router.patch(
  '/menu/:id',
  requireRoles('MANAGER', 'ADMIN'),
  validateBody(updateMenuItemSchema),
  orderController.updateMenuItem
);
router.delete(
  '/menu/:id',
  requireRoles('ADMIN'),
  orderController.deleteMenuItem
);

// Đơn hàng
router.post('/orders', validateBody(createOrderSchema), orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);
router.patch(
  '/orders/:id/status',
  validateBody(updateStatusSchema),
  orderController.updateStatus
);
router.delete(
  '/orders/:orderId/items/:itemId',
  orderController.removeOrderItem
);
router.delete(
  '/orders/:id',
  requireRoles('MANAGER', 'ADMIN'),
  orderController.deleteOrder
);

export default router;
