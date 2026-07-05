import { Decimal } from '@prisma/client/runtime/library';
import { orderRepository } from '../repositories/order.repository';
import { orderWsHub } from '../websocket/orderHub';
import { socketHub } from '../websocket/socketHub';
import { CreateOrderDto, CreateMenuItemDto, OrderStatus, PaymentMethod, UpdateMenuItemDto } from '../types';
import { encodeOrderItemMeta } from '../utils/orderItemMeta';

function notifyOrderUpdate(payload: unknown) {
  orderWsHub.broadcastOrderUpdate(payload);
  socketHub.emitOrderUpdate(payload);
}

type OrderItemInput = {
  menuItemId: string;
  quantity: number;
  unitPrice: Decimal;
  lineTotal: Decimal;
  note?: string;
};

// Service - xử lý nghiệp vụ module Đơn hàng & POS
export class OrderService {
  async getMenuItems() {
    return orderRepository.findMenuItems();
  }

  async getAllMenuItems() {
    return orderRepository.findAllMenuItems();
  }

  async createMenuItem(dto: CreateMenuItemDto) {
    if (!dto.name.trim()) throw new Error('Tên món không được để trống');
    if (dto.price <= 0) throw new Error('Giá phải lớn hơn 0');
    return orderRepository.createMenuItem({
      name: dto.name.trim(),
      price: new Decimal(dto.price),
      category: dto.category,
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
    });
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    const existing = await orderRepository.findMenuItemById(id);
    if (!existing) throw new Error('Không tìm thấy món');

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new Error('Tên món không được để trống');
    }
    if (dto.price !== undefined && dto.price <= 0) {
      throw new Error('Giá phải lớn hơn 0');
    }

    return orderRepository.updateMenuItem(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.price !== undefined && { price: new Decimal(dto.price) }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
    });
  }

  async deleteMenuItem(id: string) {
    const existing = await orderRepository.findMenuItemById(id);
    if (!existing) {
      throw new Error('Không tìm thấy món');
    }

    const refs = await orderRepository.countMenuItemOrderRefs(id);
    if (refs > 0) {
      throw new Error('Món đã có trong đơn hàng. Hãy ẩn món thay vì xóa.');
    }

    return orderRepository.deleteMenuItem(id);
  }

  private async buildOrderItems(dto: CreateOrderDto) {
    const orderItemsData: OrderItemInput[] = [];
    let subtotal = new Decimal(0);

    for (const item of dto.items) {
      const menuItem = await orderRepository.findMenuItemById(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Không tìm thấy món: ${item.menuItemId}`);
      }

      const lineTotal = new Decimal(menuItem.price).mul(item.quantity);
      subtotal = subtotal.add(lineTotal);

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        lineTotal,
        note: encodeOrderItemMeta({
          selection: item.selection,
          note: item.note,
        }),
      });
    }

    return { orderItemsData, subtotal };
  }

  async createOrder(dto: CreateOrderDto) {
    if (!dto.items.length) {
      throw new Error('Đơn hàng phải có ít nhất một món');
    }

    const { orderItemsData, subtotal } = await this.buildOrderItems(dto);

    // Gộp vào đơn đang xử lý của cùng bàn (không gộp vào đơn đã ra món)
    if (dto.tableNumber) {
      const existingOrder = await orderRepository.findProcessingOrderByTable(
        dto.tableNumber
      );
      if (existingOrder) {
        const order = await orderRepository.mergeItemsIntoOrder(
          existingOrder.id,
          orderItemsData
        );
        notifyOrderUpdate(order);
        return order;
      }
    }

    const orderNumber = `PHO-${Date.now().toString(36).toUpperCase()}`;

    const order = await orderRepository.createOrder({
      orderNumber,
      tableNumber: dto.tableNumber,
      status: OrderStatus.PREPARING,
      subtotal,
      taxAmount: 0,
      total: subtotal,
      items: { create: orderItemsData },
    });

    notifyOrderUpdate(order);
    return order;
  }

  async getOrders(status?: OrderStatus) {
    await orderRepository.consolidateDuplicateServedOrders();
    return orderRepository.findOrders(status);
  }

  async getOrderById(id: string) {
    const order = await orderRepository.findOrderById(id);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus, paymentMethod?: PaymentMethod) {
    const existing = await orderRepository.findOrderById(id);
    if (!existing) throw new Error('Không tìm thấy đơn hàng');

    if (status === OrderStatus.SERVED) {
      if (existing.status !== OrderStatus.PENDING && existing.status !== OrderStatus.PREPARING) {
        throw new Error('Chỉ đánh dấu đã ra món cho đơn đang xử lý');
      }

      if (existing.tableNumber) {
        const servedOrder = await orderRepository.findServedOrderByTable(
          existing.tableNumber,
          id
        );
        if (servedOrder) {
          const order = await orderRepository.mergeOrderIntoOrder(servedOrder.id, id);
          notifyOrderUpdate(order);
          return order;
        }
      }

      const order = await orderRepository.updateOrderStatus(id, status, paymentMethod);
      notifyOrderUpdate(order);
      return order;
    }

    if (status === OrderStatus.PAID) {
      if (existing.status !== OrderStatus.SERVED) {
        throw new Error('Chỉ thanh toán đơn đã ra món');
      }

      if (existing.tableNumber) {
        const processingOrder = await orderRepository.findProcessingOrderByTable(
          existing.tableNumber
        );
        if (processingOrder) {
          throw new Error(
            'Bàn vẫn còn món chưa ra đủ. Vui lòng đánh dấu đã ra món hết trước khi thanh toán.'
          );
        }
      }
    }

    const order = await orderRepository.updateOrderStatus(id, status, paymentMethod);
    notifyOrderUpdate(order);
    return order;
  }

  async removeOrderItem(orderId: string, itemId: string) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PREPARING) {
      throw new Error('Chỉ xóa món trong đơn đang xử lý');
    }

    const updated = await orderRepository.removeOrderItem(orderId, itemId);
    notifyOrderUpdate(updated ?? { id: orderId, deleted: true });
    return updated;
  }

  async deletePaidOrder(orderId: string) {
    const order = await orderRepository.findOrderById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    if (order.status !== OrderStatus.PAID) {
      throw new Error('Chỉ xóa đơn đã thanh toán trong lịch sử');
    }

    await orderRepository.deleteOrder(orderId);
    notifyOrderUpdate({ id: orderId, deleted: true });
    return { deleted: true };
  }
}

export const orderService = new OrderService();
