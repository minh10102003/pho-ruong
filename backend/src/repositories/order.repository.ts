import prisma from '../config/database';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';

// Repository - tầng truy cập dữ liệu cho module Đơn hàng
export class OrderRepository {
  private isSameOrderLine(
    left: { menuItemId: string; note?: string | null },
    right: { menuItemId: string; note?: string | null }
  ) {
    return left.menuItemId === right.menuItemId && (left.note ?? '') === (right.note ?? '');
  }

  async findMenuItems() {
    return prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findAllMenuItems() {
    return prisma.menuItem.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async createMenuItem(data: {
    name: string;
    price: Prisma.Decimal | number;
    category: string;
    imageUrl?: string | null;
  }) {
    return prisma.menuItem.create({
      data: {
        name: data.name,
        price: data.price,
        category: data.category,
        isActive: true,
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
  }

  async updateMenuItem(
    id: string,
    data: {
      name?: string;
      price?: Prisma.Decimal | number;
      category?: string;
      isActive?: boolean;
      imageUrl?: string | null;
    }
  ) {
    return prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async findMenuItemById(id: string) {
    return prisma.menuItem.findUnique({ where: { id } });
  }

  async countMenuItemOrderRefs(id: string) {
    return prisma.orderItem.count({ where: { menuItemId: id } });
  }

  async deleteMenuItem(id: string) {
    return prisma.menuItem.delete({ where: { id } });
  }

  async createOrder(data: Prisma.OrderCreateInput) {
    return prisma.order.create({
      data,
      include: {
        items: { include: { menuItem: true } },
      },
    });
  }

  async findProcessingOrderByTable(tableNumber: string) {
    return prisma.order.findFirst({
      where: {
        tableNumber,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING] },
      },
      include: {
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findServedOrderByTable(tableNumber: string, excludeOrderId?: string) {
    return prisma.order.findFirst({
      where: {
        tableNumber,
        status: OrderStatus.SERVED,
        ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
      },
      include: {
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async mergeOrderIntoOrder(targetOrderId: string, sourceOrderId: string) {
    if (targetOrderId === sourceOrderId) {
      throw new Error('Không thể gộp đơn với chính nó');
    }

    return prisma.$transaction(async (tx) => {
      const target = await tx.order.findUnique({
        where: { id: targetOrderId },
        include: { items: true },
      });
      const source = await tx.order.findUnique({
        where: { id: sourceOrderId },
        include: { items: true },
      });

      if (!target || !source) {
        throw new Error('Không tìm thấy đơn hàng để gộp');
      }

      for (const item of source.items) {
        const existingItem = target.items.find((i) => this.isSameOrderLine(i, item));

        if (existingItem) {
          const quantity = existingItem.quantity + item.quantity;
          const lineTotal = new Prisma.Decimal(item.unitPrice).mul(quantity);
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity, lineTotal },
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId: targetOrderId,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              note: item.note,
            },
          });
        }
      }

      const allItems = await tx.orderItem.findMany({ where: { orderId: targetOrderId } });
      const subtotal = allItems.reduce(
        (sum, item) => sum.add(item.lineTotal),
        new Prisma.Decimal(0)
      );
      const taxAmount = new Prisma.Decimal(0);
      const total = subtotal;

      await tx.order.delete({ where: { id: sourceOrderId } });

      return tx.order.update({
        where: { id: targetOrderId },
        data: { subtotal, taxAmount, total },
        include: { items: { include: { menuItem: true } } },
      });
    });
  }

  async consolidateDuplicateServedOrders() {
    const servedOrders = await prisma.order.findMany({
      where: { status: OrderStatus.SERVED, tableNumber: { not: null } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, tableNumber: true },
    });

    const byTable = new Map<string, string[]>();
    for (const order of servedOrders) {
      if (!order.tableNumber) continue;
      const ids = byTable.get(order.tableNumber) ?? [];
      ids.push(order.id);
      byTable.set(order.tableNumber, ids);
    }

    for (const ids of byTable.values()) {
      if (ids.length <= 1) continue;
      const [targetId, ...sourceIds] = ids;
      for (const sourceId of sourceIds) {
        await this.mergeOrderIntoOrder(targetId, sourceId);
      }
    }
  }

  async mergeItemsIntoOrder(
    orderId: string,
    newItems: {
      menuItemId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      lineTotal: Prisma.Decimal;
      note?: string | null;
    }[]
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new Error('Không tìm thấy đơn hàng');

      for (const newItem of newItems) {
        const existingItem = order.items.find((i) => this.isSameOrderLine(i, newItem));

        if (existingItem) {
          const quantity = existingItem.quantity + newItem.quantity;
          const lineTotal = new Prisma.Decimal(newItem.unitPrice).mul(quantity);
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity, lineTotal },
          });
        } else {
          await tx.orderItem.create({
            data: {
              orderId,
              menuItemId: newItem.menuItemId,
              quantity: newItem.quantity,
              unitPrice: newItem.unitPrice,
              lineTotal: newItem.lineTotal,
              note: newItem.note,
            },
          });
        }
      }

      const allItems = await tx.orderItem.findMany({ where: { orderId } });
      const subtotal = allItems.reduce(
        (sum, item) => sum.add(item.lineTotal),
        new Prisma.Decimal(0)
      );
      const taxAmount = new Prisma.Decimal(0);
      const total = subtotal;

      return tx.order.update({
        where: { id: orderId },
        data: { subtotal, taxAmount, total },
        include: { items: { include: { menuItem: true } } },
      });
    });
  }

  async removeOrderItem(orderId: string, itemId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new Error('Không tìm thấy đơn hàng');

      const item = order.items.find((i) => i.id === itemId);
      if (!item) throw new Error('Không tìm thấy món trong đơn');

      await tx.orderItem.delete({ where: { id: itemId } });

      const remaining = await tx.orderItem.findMany({ where: { orderId } });
      if (remaining.length === 0) {
        await tx.order.delete({ where: { id: orderId } });
        return null;
      }

      const subtotal = remaining.reduce(
        (sum, row) => sum.add(row.lineTotal),
        new Prisma.Decimal(0)
      );
      const taxAmount = new Prisma.Decimal(0);
      const total = subtotal;

      return tx.order.update({
        where: { id: orderId },
        data: { subtotal, taxAmount, total },
        include: { items: { include: { menuItem: true } } },
      });
    });
  }

  async findOrders(status?: OrderStatus) {
    return prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
      },
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus, paymentMethod?: PaymentMethod) {
    const existing = await prisma.order.findUnique({ where: { id } });

    let invoiceNumber: string | undefined;
    if (status === 'PAID' && !existing?.invoiceNumber) {
      const paidCount = await prisma.order.count({ where: { status: OrderStatus.PAID } });
      invoiceNumber = String(paidCount + 1).padStart(4, '0');
    }

    return prisma.order.update({
      where: { id },
      data: {
        status,
        paidAt: status === 'PAID' ? new Date() : undefined,
        ...(status === 'PAID' && paymentMethod ? { paymentMethod } : {}),
        ...(invoiceNumber ? { invoiceNumber } : {}),
      },
      include: {
        items: { include: { menuItem: true } },
      },
    });
  }

  async getRevenueByPaymentMethod(start: Date, end: Date) {
    return prisma.$queryRaw<
      { payment_method: string; revenue: number; order_count: bigint }[]
    >`
      SELECT
        "paymentMethod"::text AS payment_method,
        SUM("total")::float AS revenue,
        COUNT(*)::bigint AS order_count
      FROM orders
      WHERE status = 'PAID'
        AND "paidAt" >= ${start}
        AND "paidAt" < ${end}
        AND "paymentMethod" IS NOT NULL
      GROUP BY "paymentMethod"
    `;
  }

  async getRevenueByPeriod(start: Date, end: Date) {
    return prisma.$queryRaw<
      { period: string; revenue: number; order_count: bigint }[]
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "paidAt"), 'YYYY-MM-DD') AS period,
        SUM("total")::float AS revenue,
        COUNT(*)::bigint AS order_count
      FROM orders
      WHERE status = 'PAID'
        AND "paidAt" >= ${start}
        AND "paidAt" < ${end}
      GROUP BY DATE_TRUNC('day', "paidAt")
      ORDER BY period ASC
    `;
  }

  async getMonthlyRevenue(year: number) {
    return prisma.$queryRaw<
      { month: number; revenue: number; order_count: bigint }[]
    >`
      SELECT
        EXTRACT(MONTH FROM "paidAt")::int AS month,
        SUM("total")::float AS revenue,
        COUNT(*)::bigint AS order_count
      FROM orders
      WHERE status = 'PAID'
        AND EXTRACT(YEAR FROM "paidAt") = ${year}
      GROUP BY EXTRACT(MONTH FROM "paidAt")
      ORDER BY month ASC
    `;
  }

  async deleteOrder(id: string) {
    return prisma.order.delete({ where: { id } });
  }

  async getYearlyRevenue() {
    return prisma.$queryRaw<
      { year: number; revenue: number; order_count: bigint }[]
    >`
      SELECT
        EXTRACT(YEAR FROM "paidAt")::int AS year,
        SUM("total")::float AS revenue,
        COUNT(*)::bigint AS order_count
      FROM orders
      WHERE status = 'PAID'
      GROUP BY EXTRACT(YEAR FROM "paidAt")
      ORDER BY year ASC
    `;
  }
}

export const orderRepository = new OrderRepository();
