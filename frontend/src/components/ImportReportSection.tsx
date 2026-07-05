import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImportReport } from '../types';
import { COLORS } from '../constants';
import { formatCurrency, formatReceiptDate, formatReceiptTime } from '../utils/format';
import { formatQuantity } from '../utils/inventory';
import { ImportCostChart } from './charts/ImportCostChart';
import { toImportChartData } from '../utils/importReportFormat';

type Props = {
  report: ImportReport | null;
  period: 'day' | 'month' | 'year';
  periodLabel: string;
};

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.summaryCard, accent && styles.summaryCardAccent]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, accent && styles.summaryValueAccent]}>{value}</Text>
    </View>
  );
}

export function ImportReportSection({ report, period, periodLabel }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const chartData = useMemo(
    () => (report ? toImportChartData(report.timeline, period) : []),
    [report, period]
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  if (!report) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Đang tải báo cáo nhập hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.periodHint}>Kỳ thống kê: {periodLabel}</Text>

      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Tổng chi nhập"
          value={formatCurrency(report.summary.totalCost)}
          accent
        />
        <SummaryCard label="Số phiếu" value={String(report.summary.receiptCount)} />
        <SummaryCard label="Hạng mục" value={String(report.summary.categoryCount)} />
        <SummaryCard label="Mặt hàng" value={String(report.summary.ingredientCount)} />
      </View>

      <Text style={styles.subTitle}>
        {period === 'day' ? 'Chi phí trong ngày' : period === 'month' ? 'Theo ngày' : 'Theo tháng'}
      </Text>
      <ImportCostChart data={chartData} period={period} />

      <Text style={styles.subTitle}>Theo hạng mục nhập</Text>
      {report.byCategory.length === 0 ? (
        <Text style={styles.emptyText}>Không có phiếu nhập trong kỳ này</Text>
      ) : (
        report.byCategory.map((categoryRow) => {
          const expanded = expandedCategories[categoryRow.category] ?? true;
          return (
            <View key={categoryRow.category} style={styles.categoryBlock}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(categoryRow.category)}
                activeOpacity={0.85}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Text style={styles.categoryName}>{categoryRow.category}</Text>
                  <Text style={styles.categoryMeta}>
                    {categoryRow.receiptCount} phiếu · {categoryRow.items.length} món
                  </Text>
                </View>
                <View style={styles.categoryHeaderRight}>
                  <Text style={styles.categoryCost}>{formatCurrency(categoryRow.totalCost)}</Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {expanded
                ? categoryRow.items.map((item) => (
                    <View key={item.ingredientId} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.ingredientName}</Text>
                        <Text style={styles.itemMeta}>
                          {formatQuantity(item.totalQuantity)} {item.unit} · {item.receiptCount} phiếu
                        </Text>
                      </View>
                      <Text style={styles.itemCost}>{formatCurrency(item.totalCost)}</Text>
                    </View>
                  ))
                : null}
            </View>
          );
        })
      )}

      <Text style={styles.subTitle}>Chi tiết phiếu nhập</Text>
      {report.details.length === 0 ? (
        <Text style={styles.emptyText}>Chưa có phiếu nhập</Text>
      ) : (
        report.details.map((row) => (
          <View key={row.id} style={styles.detailRow}>
            <View style={styles.detailTop}>
              <Text style={styles.detailCode}>{row.receiptCode}</Text>
              <Text style={styles.detailCost}>{formatCurrency(row.totalCost)}</Text>
            </View>
            <Text style={styles.detailName}>
              {row.category} / {row.ingredientName}
            </Text>
            <Text style={styles.detailMeta}>
              {formatReceiptDate(row.receivedAt)} · {formatReceiptTime(row.receivedAt)}
            </Text>
            <Text style={styles.detailMeta}>
              SL: {formatQuantity(row.quantity)} {row.unit} × {formatCurrency(row.unitPrice)} · NCC:{' '}
              {row.supplier}
            </Text>
            {row.note ? <Text style={styles.detailNote}>Ghi chú: {row.note}</Text> : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  emptyWrap: { paddingVertical: 12 },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 8,
  },
  periodHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryCardAccent: {
    backgroundColor: COLORS.highlight,
    borderColor: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryValueAccent: {
    color: COLORS.primaryDark,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  categoryBlock: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.selected,
  },
  categoryHeaderLeft: { flex: 1, paddingRight: 8 },
  categoryHeaderRight: { alignItems: 'flex-end', gap: 4 },
  categoryName: { fontSize: 15, fontWeight: '800', color: COLORS.primaryDark },
  categoryMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  categoryCost: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  itemInfo: { flex: 1, paddingRight: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  itemMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemCost: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  detailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailCode: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark },
  detailCost: { fontSize: 14, fontWeight: '800', color: COLORS.primaryDark },
  detailName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  detailMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  detailNote: { fontSize: 12, color: COLORS.warning, marginTop: 4, fontStyle: 'italic' },
});
