import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useEmployeeStore } from '../store/employeeStore';
import { BigButton } from '../components/BigButton';
import { COLORS } from '../constants';
import { formStyles } from '../styles/formStyles';
import { formatCurrency } from '../utils/format';

function getCurrentPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function formatPayrollPeriod(year: number, month: number) {
  return `Tháng ${month}/${year}`;
}

export default function StaffProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { openTimesheets, payroll, loading, checkIn, checkOut, fetchPayroll, syncCurrentTimesheet } =
    useEmployeeStore();

  const employeeId = user?.employeeId ?? '';
  const [payrollYear, setPayrollYear] = useState(getCurrentPeriod().year);
  const [payrollMonth, setPayrollMonth] = useState(getCurrentPeriod().month);

  const openTimesheet = employeeId ? openTimesheets[employeeId] : null;
  const payrollEntry = Array.isArray(payroll) ? payroll[0] : payroll;

  useEffect(() => {
    if (!employeeId) return;
    syncCurrentTimesheet(employeeId);
    fetchPayroll(payrollYear, payrollMonth, employeeId);
  }, [employeeId, payrollYear, payrollMonth, syncCurrentTimesheet, fetchPayroll]);

  const handleCheckIn = async () => {
    if (!employeeId) return;
    try {
      await checkIn(employeeId);
      Alert.alert('Thành công', 'Check-in thành công!');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleCheckOut = async () => {
    if (!openTimesheet) return;
    try {
      await checkOut(openTimesheet.id);
      await fetchPayroll(payrollYear, payrollMonth, employeeId);
      Alert.alert('Thành công', 'Check-out thành công!');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (!employeeId) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Tài khoản chưa được gắn hồ sơ nhân viên.</Text>
        <BigButton title="Đăng xuất" onPress={handleLogout} variant="outline" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <Text style={styles.greeting}>Xin chào,</Text>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>Chấm công</Text>
        {openTimesheet ? (
          <>
            <Text style={styles.status}>Đang trong ca làm</Text>
            <Text style={styles.meta}>
              Check-in: {new Date(openTimesheet.checkIn).toLocaleString('vi-VN')}
            </Text>
            <BigButton title="Check-out" onPress={handleCheckOut} loading={loading} />
          </>
        ) : (
          <BigButton title="Check-in" onPress={handleCheckIn} loading={loading} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>
          Bảng lương · {formatPayrollPeriod(payrollYear, payrollMonth)}
        </Text>
        {payrollEntry ? (
          <>
            <Text style={styles.stat}>Tổng giờ: {payrollEntry.totalHours}h</Text>
            <Text style={styles.stat}>
              Lương/giờ: {formatCurrency(payrollEntry.hourlyRate)}
            </Text>
            <Text style={styles.salary}>
              Tổng lương: {formatCurrency(payrollEntry.totalSalary)}
            </Text>
          </>
        ) : (
          <Text style={styles.meta}>Chưa có dữ liệu chấm công trong tháng này.</Text>
        )}
      </View>

      <BigButton title="Đăng xuất" onPress={handleLogout} variant="outline" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 4 },
  phone: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  status: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  meta: { fontSize: 14, color: COLORS.textSecondary },
  stat: { fontSize: 15, color: COLORS.text },
  salary: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
});
