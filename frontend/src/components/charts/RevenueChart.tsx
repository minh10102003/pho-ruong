import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils/format';
import {
  formatCompactAxis,
  RevenueChartDatum,
} from '../../utils/chartFormat';

type Props = {
  data: RevenueChartDatum[];
  period: 'day' | 'month' | 'year';
};

export function RevenueChart({ data, period }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 56, 280);
  const chartHeight = period === 'day' ? 260 : 240;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totals = useMemo(
    () => ({
      revenue: data.reduce((sum, item) => sum + item.revenue, 0),
      orders: data.reduce((sum, item) => sum + item.orderCount, 0),
    }),
    [data]
  );

  const maxRevenue = useMemo(
    () => Math.max(...data.map((item) => item.revenue), 1),
    [data]
  );

  const barData = useMemo(
    () =>
      data.map((item, index) => ({
        value: item.revenue,
        label: item.shortLabel,
        frontColor: activeIndex === index ? COLORS.accent : COLORS.primary,
        gradientColor: COLORS.secondary,
        showGradient: true,
        onPress: () => setActiveIndex(index),
      })),
    [activeIndex, data]
  );

  const activeItem =
    activeIndex !== null && activeIndex >= 0 && activeIndex < data.length
      ? data[activeIndex]
      : null;

  if (data.length === 0) {
    return <Text style={styles.empty}>Chưa có dữ liệu doanh thu</Text>;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totals.revenue)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Tổng đơn</Text>
          <Text style={styles.summaryValue}>{totals.orders}</Text>
        </View>
      </View>

      <View style={[styles.chartBox, { width: chartWidth }]}>
        <BarChart
          data={barData}
          width={chartWidth}
          height={chartHeight}
          barWidth={Math.min(28, Math.max(14, (chartWidth - 48) / data.length - 10))}
          spacing={Math.min(14, Math.max(6, (chartWidth - 48) / data.length / 3))}
          initialSpacing={12}
          endSpacing={12}
          roundedTop
          roundedBottom
          maxValue={Math.ceil(maxRevenue * 1.12)}
          noOfSections={4}
          formatYLabel={(label) => formatCompactAxis(parseFloat(label) || 0)}
          xAxisColor={COLORS.border}
          yAxisColor={COLORS.border}
          rulesColor={COLORS.border}
          rulesType="solid"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          isAnimated
          animationDuration={500}
          scrollToEnd={period === 'day' && data.length > 7}
          showScrollIndicator={period === 'day' && data.length > 7}
        />
      </View>

      <Text style={styles.hint}>Chạm vào cột để xem chi tiết từng kỳ</Text>

      {activeItem ? (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{activeItem.label}</Text>
          <Text style={styles.detailRevenue}>{formatCurrency(activeItem.revenue)}</Text>
          <Text style={styles.detailMeta}>{activeItem.orderCount} đơn đã thanh toán</Text>
        </View>
      ) : (
        <View style={styles.legendList}>
          {data.map((item) => (
            <View key={item.label} style={styles.legendRow}>
              <Text style={styles.legendLabel}>{item.label}</Text>
              <View style={styles.legendValues}>
                <Text style={styles.legendRevenue}>{formatCurrency(item.revenue)}</Text>
                <Text style={styles.legendOrders}>{item.orderCount} đơn</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.selected,
    borderRadius: 10,
    padding: 12,
  },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  chartBox: { alignSelf: 'center', overflow: 'hidden' },
  axisText: { color: COLORS.textSecondary, fontSize: 11 },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: COLORS.selected,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  detailTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  detailRevenue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  detailMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  legendList: { gap: 8 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  legendLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary, paddingRight: 8 },
  legendValues: { alignItems: 'flex-end' },
  legendRevenue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  legendOrders: { fontSize: 12, color: COLORS.textSecondary },
});
