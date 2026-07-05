import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
import { requireRoles } from '../middleware/auth';
import { inventoryController } from '../controllers/inventory.controller';

const router = Router();

const ingredientSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  minStock: z.number().optional(),
});

const updateIngredientSchema = z.object({
  category: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  minStock: z.number().min(0).optional(),
});

const receiptSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  supplier: z.string().min(1),
  note: z.string().optional(),
  receivedAt: z.string().datetime().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1),
});

const renameCategorySchema = z.object({
  oldName: z.string().min(1),
  newName: z.string().min(1),
});

router.get('/categories', inventoryController.getCategories);
router.post(
  '/categories',
  requireRoles('ADMIN'),
  validateBody(categorySchema),
  inventoryController.createCategory
);
router.patch(
  '/categories/rename',
  requireRoles('ADMIN'),
  validateBody(renameCategorySchema),
  inventoryController.renameCategory
);
router.delete(
  '/categories/:name',
  requireRoles('ADMIN'),
  inventoryController.deleteCategory
);

router.get('/ingredients', inventoryController.getIngredients);
router.post(
  '/ingredients',
  requireRoles('ADMIN'),
  validateBody(ingredientSchema),
  inventoryController.createIngredient
);
router.patch(
  '/ingredients/:id',
  requireRoles('ADMIN'),
  validateBody(updateIngredientSchema),
  inventoryController.updateIngredient
);
router.delete(
  '/ingredients/:id',
  requireRoles('ADMIN'),
  inventoryController.deleteIngredient
);
router.post('/receipts', validateBody(receiptSchema), inventoryController.createReceipt);
router.get('/receipts', inventoryController.getReceipts);
router.delete(
  '/receipts/:id',
  requireRoles('MANAGER', 'ADMIN'),
  inventoryController.deleteReceipt
);

export default router;
