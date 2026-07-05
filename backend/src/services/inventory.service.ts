import { Decimal } from '@prisma/client/runtime/library';
import { inventoryRepository } from '../repositories/inventory.repository';
import { CreateIngredientDto, CreateInventoryReceiptDto, UpdateIngredientDto } from '../types';

// Service - xử lý nghiệp vụ module Kho & Nhập hàng
export class InventoryService {
  async getIngredients() {
    return inventoryRepository.findAllIngredients();
  }

  async createIngredient(dto: CreateIngredientDto) {
    if (!dto.category.trim()) {
      throw new Error('Hạng mục không được để trống');
    }
    if (!dto.name.trim()) {
      throw new Error('Tên nguyên liệu không được để trống');
    }
    if (!dto.unit.trim()) {
      throw new Error('Đơn vị không được để trống');
    }

    const category = dto.category.trim();
    await inventoryRepository.ensureCategoryExists(category);

    return inventoryRepository.createIngredient({
      category,
      name: dto.name.trim(),
      unit: dto.unit.trim(),
      minStock: dto.minStock ?? 0,
    });
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto) {
    const existing = await inventoryRepository.findIngredientById(id);
    if (!existing) {
      throw new Error('Không tìm thấy nguyên liệu');
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new Error('Tên nguyên liệu không được để trống');
    }
    if (dto.category !== undefined && !dto.category.trim()) {
      throw new Error('Hạng mục không được để trống');
    }
    if (dto.unit !== undefined && !dto.unit.trim()) {
      throw new Error('Đơn vị không được để trống');
    }
    if (dto.minStock !== undefined && dto.minStock < 0) {
      throw new Error('Tồn tối thiểu không được âm');
    }

    return inventoryRepository.updateIngredient(id, {
      ...(dto.category !== undefined && { category: dto.category.trim() }),
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.unit !== undefined && { unit: dto.unit.trim() }),
      ...(dto.minStock !== undefined && { minStock: dto.minStock }),
    });
  }

  async deleteIngredient(id: string) {
    const existing = await inventoryRepository.findIngredientById(id);
    if (!existing) {
      throw new Error('Không tìm thấy nguyên liệu');
    }

    return inventoryRepository.deleteIngredient(id);
  }

  async createReceipt(dto: CreateInventoryReceiptDto) {
    const ingredient = await inventoryRepository.findIngredientById(dto.ingredientId);
    if (!ingredient) {
      throw new Error('Không tìm thấy nguyên liệu');
    }

    const quantity = new Decimal(dto.quantity);
    const unitPrice = new Decimal(dto.unitPrice);
    const totalCost = quantity.mul(unitPrice);
    const receiptCode = `NK-${Date.now().toString(36).toUpperCase()}`;

    // Tạo phiếu nhập và cập nhật tồn kho trong transaction
    const receipt = await inventoryRepository.createReceipt(
      {
        receiptCode,
        quantity,
        unitPrice,
        totalCost,
        supplier: dto.supplier,
        note: dto.note,
        ...(dto.receivedAt ? { receivedAt: new Date(dto.receivedAt) } : {}),
        ingredient: { connect: { id: dto.ingredientId } },
      },
      dto.ingredientId,
      quantity
    );

    return receipt;
  }

  async getReceipts() {
    return inventoryRepository.findReceipts();
  }

  async getCategories() {
    const [saved, ingredients] = await Promise.all([
      inventoryRepository.findAllCategories(),
      inventoryRepository.findAllIngredients(),
    ]);
    const names = new Set<string>(saved.map((item) => item.name));
    for (const ingredient of ingredients) {
      const category = ingredient.category?.trim();
      if (category) names.add(category);
    }
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((name) => ({ name }));
  }

  async createCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Tên hạng mục không được để trống');
    const existing = await inventoryRepository.findCategoryByName(trimmed);
    if (existing) throw new Error('Hạng mục đã tồn tại');
    const ingredientCount = await inventoryRepository.countIngredientsInCategory(trimmed);
    if (ingredientCount > 0) {
      await inventoryRepository.ensureCategoryExists(trimmed);
      return { name: trimmed };
    }
    const created = await inventoryRepository.createCategory(trimmed);
    return { name: created.name };
  }

  async renameCategory(oldName: string, newName: string) {
    const from = oldName.trim();
    const to = newName.trim();
    if (!from || !to) throw new Error('Tên hạng mục không hợp lệ');
    if (from === to) return { name: to };
    const conflict = await inventoryRepository.findCategoryByName(to);
    if (conflict) throw new Error('Hạng mục mới đã tồn tại');
    await inventoryRepository.renameCategory(from, to);
    return { name: to };
  }

  async deleteCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Tên hạng mục không hợp lệ');
    await inventoryRepository.deleteCategory(trimmed);
    return { deleted: true };
  }
}

export const inventoryService = new InventoryService();
