import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service';

// Controller - xử lý HTTP request cho module Kho
export class InventoryController {
  getIngredients = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await inventoryService.getIngredients();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  createIngredient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await inventoryService.createIngredient(req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  updateIngredient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await inventoryService.updateIngredient(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  deleteIngredient = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await inventoryService.deleteIngredient(req.params.id);
      res.json({ success: true, message: 'Đã xóa nguyên liệu' });
    } catch (e) {
      next(e);
    }
  };

  createReceipt = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await inventoryService.createReceipt(req.body);
      res.status(201).json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };

  getReceipts = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await inventoryService.getReceipts();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  };
}

export const inventoryController = new InventoryController();
