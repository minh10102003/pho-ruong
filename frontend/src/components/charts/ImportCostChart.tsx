import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils/format';
import { formatCompactAxis } from '../../utils/chartFormat';
import { ImportChartDatum } from '../../utils/importReportFormat';

type Props = {
  data: ImportChartDatum[];
  period: 'day' | 'month' | 'year';
};

export function ImportCostChart({ data, period }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 56, 280);
  const chartHeight = period === 'day' ? 220 : 240;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const maxCost = useMemo(
    () => Math.max(...data.map((item) => item.totalCost), 1),
    [data]
  );

  const barData = useMemo(
    () =>
      data.map((item, index) => ({
        value: item.totalCost,
        label: item.shortLabel,
        frontColor: activeIndex === index ? COLORS.accent : COLORS.primaryDark,
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
    return <Text style={styles.empty}>Chưa có dữ liệu nhập hàng trong kỳ này</Text>;
  }

  return (
    <View style={styles.wrapper}>
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
          maxValue={Math.ceil(maxCost * 1.12)}
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
          scrollToEnd={data.length > 7}
          showScrollIndicator={data.length > 7}
        />
      </View>

      <Text style={styles.hint}>Chạm vào cột để xem chi tiết từng kỳ nhập</Text>

      {activeItem ? (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{activeItem.label}</Text>
          <Text style={styles.detailCost}>{formatCurrency(activeItem.totalCost)}</Text>
          <Text style={styles.detailMeta}>
            {activeItem.receiptCount} phiếu · {activeItem.totalQuantity} đv
          </Text>
        </View>
      ) : (
        <View style={styles.legendList}>
          {data.map((item) => (
            <View key={item.label} style={styles.legendRow}>
              <Text style={styles.legendLabel}>{item.label}</Text>
              <View style={styles.legendValues}>
                <Text style={styles.legendCost}>{formatCurrency(item.totalCost)}</Text>
                <Text style={styles.legendMeta}>{item.receiptCount} phiếu</Text>
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
  chartBox: { alignSelf: 'center', overflow: 'hidden' },
  axisText: { color: COLORS.textSecondary, fontSize: 11 },
  hint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  detailCard: {
    backgroundColor: COLORS.highlight,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  detailTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  detailCost: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
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
  legendCost: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  legendMeta: { fontSize: 12, color: COLORS.textSecondary },
});
