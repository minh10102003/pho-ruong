import prisma from '../config/database';
import { Prisma } from '@prisma/client';

// Repository - tầng truy cập dữ liệu cho module Kho
export class InventoryRepository {
  async findAllIngredients() {
    return prisma.ingredient.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  }

  async findAllCategories() {
    return prisma.ingredientCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findCategoryByName(name: string) {
    return prisma.ingredientCategory.findUnique({ where: { name } });
  }

  async createCategory(name: string) {
    return prisma.ingredientCategory.create({ data: { name } });
  }

  async ensureCategoryExists(name: string) {
    await prisma.ingredientCategory.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }

  async renameCategory(oldName: string, newName: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.ingredientCategory.findUnique({ where: { name: oldName } });
      if (existing) {
        await tx.ingredientCategory.update({
          where: { id: existing.id },
          data: { name: newName },
        });
      } else {
        await tx.ingredientCategory.create({ data: { name: newName } });
      }
      await tx.ingredient.updateMany({
        where: { category: oldName },
        data: { category: newName },
      });
    });
  }

  async deleteCategory(name: string) {
    const ingredientCount = await prisma.ingredient.count({ where: { category: name } });
    if (ingredientCount > 0) {
      throw new Error('Không thể xóa hạng mục đang có nguyên liệu');
    }
    await prisma.ingredientCategory.deleteMany({ where: { name } });
  }

  async countIngredientsInCategory(name: string) {
    return prisma.ingredient.count({ where: { category: name } });
  }

  async findIngredientById(id: string) {
    return prisma.ingredient.findUnique({ where: { id } });
  }

  async createIngredient(data: Prisma.IngredientCreateInput) {
    return prisma.ingredient.create({ data });
  }

  async updateIngredient(
    id: string,
    data: Pick<Prisma.IngredientUpdateInput, 'category' | 'name' | 'unit' | 'minStock'>
  ) {
    return prisma.ingredient.update({ where: { id }, data });
  }

  async deleteIngredient(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.inventoryReceipt.deleteMany({ where: { ingredientId: id } });
      return tx.ingredient.delete({ where: { id } });
    });
  }

  async updateIngredientStock(id: string, quantity: Prisma.Decimal) {
    return prisma.ingredient.update({
      where: { id },
      data: { stockQty: { increment: quantity } },
    });
  }

  async createReceipt(data: Prisma.InventoryReceiptCreateInput, ingredientId: string, quantity: Prisma.Decimal) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.inventoryReceipt.create({
        data,
        include: { ingredient: true },
      });
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { stockQty: { increment: quantity } },
      });
      return receipt;
    });
  }

  async findReceiptsInPeriod(start: Date, end: Date) {
    return prisma.inventoryReceipt.findMany({
      where: {
        receivedAt: { gte: start, lt: end },
      },
      include: { ingredient: true },
      orderBy: [{ receivedAt: 'asc' }, { receiptCode: 'asc' }],
    });
  }

  async findReceipts(limit = 50) {
    return prisma.inventoryReceipt.findMany({
      include: { ingredient: true },
      orderBy: { receivedAt: 'desc' },
      take: limit,
    });
  }

  async findReceiptById(id: string) {
    return prisma.inventoryReceipt.findUnique({
      where: { id },
      include: { ingredient: true },
    });
  }

  async deleteReceipt(id: string) {
    return prisma.$transaction(async (tx) => {
      const receipt = await tx.inventoryReceipt.findUnique({
        where: { id },
        include: { ingredient: true },
      });
      if (!receipt) throw new Error('Không tìm thấy phiếu nhập');

      const ingredient = await tx.ingredient.findUnique({
        where: { id: receipt.ingredientId },
      });
      if (!ingredient) throw new Error('Không tìm thấy nguyên liệu');

      const nextStock = ingredient.stockQty.sub(receipt.quantity);
      if (nextStock.lessThan(0)) {
        throw new Error('Không thể xóa phiếu nhập vì tồn kho hiện tại không đủ');
      }

      await tx.ingredient.update({
        where: { id: receipt.ingredientId },
        data: { stockQty: nextStock },
      });
      await tx.inventoryReceipt.delete({ where: { id } });
      return receipt;
    });
  }

  // Tổng chi phí nhập hàng theo khoảng thời gian (dùng cho báo cáo)
  async getImportCostByPeriod(start: Date, end: Date) {
    return prisma.$queryRaw<{ total_cost: number }[]>`
      SELECT COALESCE(SUM("totalCost"), 0)::float AS total_cost
      FROM inventory_receipts
      WHERE "receivedAt" >= ${start}
        AND "receivedAt" < ${end}
    `;
  }

  async getMonthlyImportCost(year: number) {
    return prisma.$queryRaw<{ month: number; total_cost: number }[]>`
      SELECT
        EXTRACT(MONTH FROM "receivedAt")::int AS month,
        SUM("totalCost")::float AS total_cost
      FROM inventory_receipts
      WHERE EXTRACT(YEAR FROM "receivedAt") = ${year}
      GROUP BY EXTRACT(MONTH FROM "receivedAt")
      ORDER BY month ASC
    `;
  }
}

export const inventoryRepository = new InventoryRepository();
