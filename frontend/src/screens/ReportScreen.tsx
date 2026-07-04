import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { useReportStore } from '../store/reportStore';
import { BigButton } from '../components/BigButton';
import { RevenueChart } from '../components/charts/RevenueChart';
import { PaymentMethodChart } from '../components/charts/PaymentMethodChart';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/format';
import { formStyles } from '../styles/formStyles';
import { toRevenueChartData } from '../utils/chartFormat';

// Màn hình Báo cáo doanh thu & Thuế
export default function ReportScreen() {
  const {
    revenue,
    taxReport,
    period,
    loading,
    setPeriod,
    fetchRevenue,
    fetchTaxReport,
    exportTax,
  } = useReportStore();

  const chartData = useMemo(
    () => toRevenueChartData(revenue, period),
    [revenue, period]
  );

  useEffect(() => {
    fetchRevenue();
    fetchTaxReport();
  }, [period]);

  const handleExport = async () => {
    try {
      const data = await exportTax();
      await Share.share({
        message: data,
        title: 'Báo cáo thuế',
      });
      Alert.alert('Thành công', 'Đã xuất báo cáo thuế (JSON)');
    } catch {
      Alert.alert('Lỗi', 'Không thể xuất báo cáo');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.filterRow}>
        {(['day', 'month', 'year'] as const).map((p) => (
          <BigButton
            key={p}
            title={p === 'day' ? 'Ngày' : p === 'month' ? 'Tháng' : 'Năm'}
            onPress={() => setPeriod(p)}
            variant={period === p ? 'primary' : 'outline'}
            style={styles.filterBtn}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>Doanh thu</Text>
        <RevenueChart data={chartData} period={period} />
      </View>

      {taxReport && (
        <View style={styles.section}>
          <Text style={formStyles.sectionTitle}>Phân bổ thanh toán</Text>
          <PaymentMethodChart taxReport={taxReport} />
        </View>
      )}

      {taxReport && (
        <View style={styles.section}>
          <Text style={formStyles.sectionTitle}>Báo cáo thuế ({taxReport.taxType})</Text>

          <View style={styles.taxRow}>
            <Text>Tổng doanh thu:</Text>
            <Text style={styles.taxValue}>
              {formatCurrency(taxReport.totalRevenue)}
            </Text>
          </View>
          <View style={styles.taxRow}>
            <Text>Tiền mặt ({taxReport.cashOrderCount} đơn):</Text>
            <Text style={styles.taxValue}>
              {formatCurrency(taxReport.cashRevenue)}
            </Text>
          </View>
          <View style={styles.taxRow}>
            <Text>Chuyển khoản ({taxReport.transferOrderCount} đơn):</Text>
            <Text style={styles.taxValue}>
              {formatCurrency(taxReport.transferRevenue)}
            </Text>
          </View>
          <View style={styles.taxRow}>
            <Text>Chi phí nhập hàng:</Text>
            <Text style={styles.taxValue}>
              {formatCurrency(taxReport.totalImportCost)}
            </Text>
          </View>
          <View style={styles.taxRow}>
            <Text>Thu nhập chịu thuế:</Text>
            <Text style={styles.taxValue}>
              {formatCurrency(taxReport.taxableIncome)}
            </Text>
          </View>
          <View style={styles.taxRow}>
            <Text>Thuế ({taxReport.taxRate}%):</Text>
            <Text style={[styles.taxValue, styles.taxAmount]}>
              {formatCurrency(taxReport.taxAmount)}
            </Text>
          </View>
          <View style={[styles.taxRow, styles.netRow]}>
            <Text style={styles.netLabel}>Lợi nhuận ròng:</Text>
            <Text style={styles.netValue}>
              {formatCurrency(taxReport.netProfit)}
            </Text>
          </View>

          <BigButton
            title="Xuất báo cáo thuế (PDF/Excel)"
            onPress={handleExport}
            loading={loading}
            variant="secondary"
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  filterBtn: { flex: 1, minHeight: 44, paddingVertical: 8 },
  section: {
    backgroundColor: COLORS.surface,
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taxValue: { fontWeight: '600' },
  taxAmount: { color: COLORS.error },
  netRow: { borderBottomWidth: 0, marginTop: 8 },
  netLabel: { fontSize: 16, fontWeight: '700' },
  netValue: { fontSize: 16, fontWeight: '700', color: COLORS.success },
});
