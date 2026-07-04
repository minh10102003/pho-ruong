import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { COLORS } from '../../constants';
import { formatCurrency } from '../../utils/format';
import { parseQuantity } from '../../utils/inventory';
import { TaxReport } from '../../types';

type SliceDatum = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  taxReport: TaxReport;
};

function buildSlices(taxReport: TaxReport): SliceDatum[] {
  const slices: SliceDatum[] = [];
  const cash = parseQuantity(taxReport.cashRevenue);
  const transfer = parseQuantity(taxReport.transferRevenue);

  if (cash > 0) {
    slices.push({
      label: 'Tiền mặt',
      value: cash,
      color: COLORS.primary,
    });
  }
  if (transfer > 0) {
    slices.push({
      label: 'Chuyển khoản',
      value: transfer,
      color: COLORS.accent,
    });
  }
  return slices;
}

export function PaymentMethodChart({ taxReport }: Props) {
  const { width } = useWindowDimensions();
  const chartSize = Math.min(Math.max(width - 72, 240), 320);
  const radius = chartSize / 2 - 8;
  const innerRadius = radius * 0.55;

  const data = useMemo(() => buildSlices(taxReport), [taxReport]);

  const pieData = useMemo(
    () =>
      data.map((item) => ({
        value: item.value,
        color: item.color,
        text: item.label,
        tooltipText: `${item.label}: ${formatCurrency(item.value)}`,
      })),
    [data]
  );

  if (data.length === 0) {
    const total = parseQuantity(taxReport.totalRevenue);
    return (
      <Text style={styles.empty}>
        {total > 0
          ? 'Chưa có dữ liệu phân loại thanh toán. Các đơn có thể chưa ghi phương thức (tiền mặt / chuyển khoản) khi thanh toán.'
          : 'Chưa có doanh thu trong kỳ này.'}
      </Text>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.chartBox, { width: chartSize, height: chartSize }]}>
        <PieChart
          data={pieData}
          donut
          radius={radius}
          innerRadius={innerRadius}
          innerCircleColor={COLORS.surface}
          showText={false}
          showTooltip
          focusOnPress
          isAnimated
          animationDuration={500}
          strokeColor={COLORS.surface}
          strokeWidth={2}
        />
      </View>

      <View style={styles.legend}>
        {data.map((item) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <View key={item.label} style={styles.legendRow}>
              <View style={styles.legendLeft}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendValue}>{formatCurrency(item.value)}</Text>
                <Text style={styles.legendPercent}>{percent}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12, alignItems: 'center' },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: 12,
    lineHeight: 20,
  },
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { width: '100%', gap: 10 },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 14, color: COLORS.text },
  legendRight: { alignItems: 'flex-end' },
  legendValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  legendPercent: { fontSize: 12, color: COLORS.textSecondary },
});
