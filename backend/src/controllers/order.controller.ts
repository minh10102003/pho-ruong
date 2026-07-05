import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { OrderStatus } from '../types';

// Controller - xử lý HTTP request cho module Đơn hàng
export class OrderController {
  getMenu = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await orderService.getMenuItems();
      res.json({ success: true, data: items });
    } catch (e) {
      next(e);
    }
  };

  getAllMenu = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await orderService.getAllMenuItems();
      res.json({ success: true, data: items });
    } catch (e) {
      next(e);
    }
  };

  createMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await orderService.createMenuItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (e) {
      next(e);
    }
  };

  updateMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await orderService.updateMenuItem(req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (e) {
      next(e);
    }
  };

  deleteMenuItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await orderService.deleteMenuItem(req.params.id);
      res.json({ success: true, data: { deleted: true } });
    } catch (e) {
      next(e);
    }
  };

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.createOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  };

  getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as OrderStatus | undefined;
      const orders = await orderService.getOrders(status);
      res.json({ success: true, data: orders });
    } catch (e) {
      next(e);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (user?.role === 'STAFF' && req.body.status === 'PAID') {
        res.status(403).json({ success: false, error: 'Nhân viên không có quyền thanh toán' });
        return;
      }
      if (user?.role === 'STAFF' && req.body.paymentMethod) {
        res.status(403).json({ success: false, error: 'Nhân viên không có quyền thanh toán' });
        return;
      }

      const order = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.body.paymentMethod
      );
      res.json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  };

  removeOrderItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderService.removeOrderItem(
        req.params.orderId,
        req.params.itemId
      );
      res.json({ success: true, data: order });
    } catch (e) {
      next(e);
    }
  };

  deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await orderService.deletePaidOrder(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };
}

export const orderController = new OrderController();
