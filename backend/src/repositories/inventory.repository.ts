import prisma from '../config/database';
import { Prisma } from '@prisma/client';

// Repository - tầng truy cập dữ liệu cho module Kho
export class InventoryRepository {
  async findAllIngredients() {
    return prisma.ingredient.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
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

  async findReceipts(limit = 50) {
    return prisma.inventoryReceipt.findMany({
      include: { ingredient: true },
      orderBy: { receivedAt: 'desc' },
      take: limit,
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
