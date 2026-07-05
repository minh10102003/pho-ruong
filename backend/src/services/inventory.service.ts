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

    return inventoryRepository.createIngredient({
      category: dto.category.trim(),
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
}

export const inventoryService = new InventoryService();
