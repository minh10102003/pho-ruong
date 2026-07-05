import { orderRepository } from '../repositories/order.repository';
import { inventoryRepository } from '../repositories/inventory.repository';
import { taxRepository } from '../repositories/tax.repository';
import { config } from '../config';
import { ReportFilterDto } from '../types';

// Service - xử lý nghiệp vụ Báo cáo doanh thu & Thuế
export class ReportService {
  private getDateRange(period: 'day' | 'month' | 'year', dateStr?: string) {
    const base = dateStr ? new Date(dateStr) : new Date();

    if (period === 'day') {
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }

    if (period === 'month') {
      const start = new Date(base.getFullYear(), base.getMonth(), 1);
      const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      return { start, end };
    }

    // year
    const start = new Date(base.getFullYear(), 0, 1);
    const end = new Date(base.getFullYear() + 1, 0, 1);
    return { start, end };
  }

  async getRevenueReport(filter: ReportFilterDto) {
    const { period, date } = filter;

    if (period === 'day') {
      const { start, end } = this.getDateRange('day', date);
      const rows = await orderRepository.getRevenueByPeriod(start, end);
      return rows.map((r) => ({
        period: r.period,
        revenue: Number(r.revenue),
        orderCount: Number(r.order_count),
      }));
    }

    if (period === 'month') {
      const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
      const rows = await orderRepository.getMonthlyRevenue(year);
      return rows.map((r) => ({
        period: `Tháng ${r.month}`,
        revenue: Number(r.revenue),
        orderCount: Number(r.order_count),
      }));
    }

    const rows = await orderRepository.getYearlyRevenue();
    return rows.map((r) => ({
      period: `Năm ${r.year}`,
      revenue: Number(r.revenue),
      orderCount: Number(r.order_count),
    }));
  }

  // Báo cáo thuế: doanh thu - chi phí nhập hàng -> tính thuế
  async getTaxReport(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter.period, filter.date);

    const revenueRows = await orderRepository.getRevenueByPeriod(start, end);
    const totalRevenue = revenueRows.reduce((sum, r) => sum + Number(r.revenue), 0);

    const paymentRows = await orderRepository.getRevenueByPaymentMethod(start, end);
    const cashRow = paymentRows.find((r) => r.payment_method === 'CASH');
    const transferRow = paymentRows.find((r) => r.payment_method === 'TRANSFER');

    const costRows = await inventoryRepository.getImportCostByPeriod(start, end);
    const totalImportCost = Number(costRows[0]?.total_cost ?? 0);

    const taxConfig = await taxRepository.getActiveTaxConfig();
    const taxRate = taxConfig ? Number(taxConfig.rate) : config.taxRate;
    const isFlat = taxConfig?.isFlat ?? false;
    const flatAmount = taxConfig?.flatAmount ? Number(taxConfig.flatAmount) : 0;

    const taxableIncome = totalRevenue - totalImportCost;
    const taxAmount = isFlat
      ? flatAmount
      : Math.max(0, taxableIncome * taxRate) / 100;

    return {
      period: filter.period,
      from: start.toISOString(),
      to: end.toISOString(),
      totalRevenue,
      cashRevenue: Number(cashRow?.revenue ?? 0),
      transferRevenue: Number(transferRow?.revenue ?? 0),
      cashOrderCount: Number(cashRow?.order_count ?? 0),
      transferOrderCount: Number(transferRow?.order_count ?? 0),
      totalImportCost,
      taxableIncome,
      taxRate,
      taxType: isFlat ? 'KHOAN' : 'VAT',
      taxAmount: Math.round(taxAmount),
      netProfit: Math.round(taxableIncome - taxAmount),
    };
  }

  // Dữ liệu xuất báo cáo (giả lập PDF/Excel - trả JSON để frontend export)
  async exportTaxReport(filter: ReportFilterDto) {
    const report = await this.getTaxReport(filter);
    return {
      filename: `bao-cao-thue-${filter.period}-${Date.now()}.json`,
      format: 'json', // Frontend có thể chuyển sang PDF/Excel
      generatedAt: new Date().toISOString(),
      data: report,
    };
  }

  async getImportReport(filter: ReportFilterDto) {
    const { start, end } = this.getDateRange(filter.period, filter.date);
    const receipts = await inventoryRepository.findReceiptsInPeriod(start, end);

    type DetailRow = {
      id: string;
      receiptCode: string;
      receivedAt: string;
      category: string;
      ingredientId: string;
      ingredientName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      totalCost: number;
      supplier: string;
      note: string | null;
    };

    const details: DetailRow[] = receipts.map((receipt) => ({
      id: receipt.id,
      receiptCode: receipt.receiptCode,
      receivedAt: receipt.receivedAt.toISOString(),
      category: receipt.ingredient.category?.trim() || 'Khác',
      ingredientId: receipt.ingredientId,
      ingredientName: receipt.ingredient.name,
      unit: receipt.ingredient.unit,
      quantity: Number(receipt.quantity),
      unitPrice: Number(receipt.unitPrice),
      totalCost: Number(receipt.totalCost),
      supplier: receipt.supplier,
      note: receipt.note,
    }));

    const timelineMap = new Map<
      string,
      { label: string; totalCost: number; receiptCount: number; totalQuantity: number }
    >();

    for (const row of details) {
      const date = new Date(row.receivedAt);
      let key: string;
      let label: string;

      if (filter.period === 'year') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
      } else {
        key = row.receivedAt.slice(0, 10);
        label = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date);
      }

      const bucket = timelineMap.get(key) ?? {
        label,
        totalCost: 0,
        receiptCount: 0,
        totalQuantity: 0,
      };
      bucket.totalCost += row.totalCost;
      bucket.receiptCount += 1;
      bucket.totalQuantity += row.quantity;
      timelineMap.set(key, bucket);
    }

    const timeline = Array.from(timelineMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => ({
        key,
        label: value.label,
        totalCost: Math.round(value.totalCost),
        receiptCount: value.receiptCount,
        totalQuantity: Number(value.totalQuantity.toFixed(3)),
      }));

    const categoryMap = new Map<
      string,
      {
        category: string;
        totalCost: number;
        receiptCount: number;
        items: Map<
          string,
          {
            ingredientId: string;
            ingredientName: string;
            unit: string;
            totalQuantity: number;
            totalCost: number;
            receiptCount: number;
          }
        >;
      }
    >();

    for (const row of details) {
      const categoryEntry = categoryMap.get(row.category) ?? {
        category: row.category,
        totalCost: 0,
        receiptCount: 0,
        items: new Map(),
      };
      categoryEntry.totalCost += row.totalCost;
      categoryEntry.receiptCount += 1;

      const itemEntry = categoryEntry.items.get(row.ingredientId) ?? {
        ingredientId: row.ingredientId,
        ingredientName: row.ingredientName,
        unit: row.unit,
        totalQuantity: 0,
        totalCost: 0,
        receiptCount: 0,
      };
      itemEntry.totalQuantity += row.quantity;
      itemEntry.totalCost += row.totalCost;
      itemEntry.receiptCount += 1;
      categoryEntry.items.set(row.ingredientId, itemEntry);
      categoryMap.set(row.category, categoryEntry);
    }

    const byCategory = Array.from(categoryMap.values())
      .map((entry) => ({
        category: entry.category,
        totalCost: Math.round(entry.totalCost),
        receiptCount: entry.receiptCount,
        items: Array.from(entry.items.values())
          .map((item) => ({
            ...item,
            totalQuantity: Number(item.totalQuantity.toFixed(3)),
            totalCost: Math.round(item.totalCost),
          }))
          .sort((left, right) => right.totalCost - left.totalCost),
      }))
      .sort((left, right) => right.totalCost - left.totalCost);

    const totalCost = details.reduce((sum, row) => sum + row.totalCost, 0);

    return {
      period: filter.period,
      from: start.toISOString(),
      to: end.toISOString(),
      summary: {
        totalCost: Math.round(totalCost),
        receiptCount: details.length,
        categoryCount: categoryMap.size,
        ingredientCount: new Set(details.map((row) => row.ingredientId)).size,
      },
      timeline,
      byCategory,
      details,
    };
  }
}

export const reportService = new ReportService();
