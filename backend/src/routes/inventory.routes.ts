import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate';
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

router.get('/ingredients', inventoryController.getIngredients);
router.post('/ingredients', validateBody(ingredientSchema), inventoryController.createIngredient);
router.patch(
  '/ingredients/:id',
  validateBody(updateIngredientSchema),
  inventoryController.updateIngredient
);
router.delete('/ingredients/:id', inventoryController.deleteIngredient);
router.post('/receipts', validateBody(receiptSchema), inventoryController.createReceipt);
router.get('/receipts', inventoryController.getReceipts);

export default router;
