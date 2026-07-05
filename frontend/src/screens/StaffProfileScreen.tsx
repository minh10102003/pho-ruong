import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useEmployeeStore } from '../store/employeeStore';
import { useStaffProfileRefresh } from '../hooks/useStaffProfileRefresh';
import { useNotificationStore } from '../store/notificationStore';
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
  const showToast = useNotificationStore((s) => s.showToast);
  const {
    openTimesheets,
    myPendingCheckInRequest,
    myPendingCheckOutRequest,
    payroll,
    loading,
    requestCheckIn,
    cancelMyCheckInRequest,
    requestCheckOut,
    cancelMyCheckOutRequest,
    fetchPayroll,
    fetchMyPendingCheckInRequest,
    fetchMyPendingCheckOutRequest,
  } = useEmployeeStore();

  const employeeId = user?.employeeId ?? '';
  const [payrollYear] = useState(getCurrentPeriod().year);
  const [payrollMonth] = useState(getCurrentPeriod().month);

  const openTimesheet = employeeId ? openTimesheets[employeeId] : null;
  const payrollEntry = Array.isArray(payroll) ? payroll[0] : payroll;
  const pendingCheckIn =
    myPendingCheckInRequest?.status === 'PENDING' ? myPendingCheckInRequest : null;
  const pendingCheckOut =
    myPendingCheckOutRequest?.status === 'PENDING' ? myPendingCheckOutRequest : null;

  useStaffProfileRefresh(employeeId, payrollYear, payrollMonth);

  const handleRequestCheckIn = async () => {
    if (!employeeId) return;
    try {
      await requestCheckIn(employeeId);
      showToast({
        title: 'Đã gửi yêu cầu',
        message: 'Yêu cầu check-in đang chờ quản lý duyệt.',
        type: 'info',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleCancelRequest = async () => {
    try {
      await cancelMyCheckInRequest();
      await fetchMyPendingCheckInRequest();
      showToast({
        title: 'Đã hủy',
        message: 'Đã hủy yêu cầu check-in.',
        type: 'info',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleRequestCheckOut = async () => {
    if (!openTimesheet) return;
    try {
      await requestCheckOut(openTimesheet.id);
      showToast({
        title: 'Đã gửi yêu cầu',
        message: 'Yêu cầu check-out đang chờ quản lý duyệt.',
        type: 'info',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleCancelCheckOutRequest = async () => {
    try {
      await cancelMyCheckOutRequest();
      await fetchMyPendingCheckOutRequest();
      showToast({
        title: 'Đã hủy',
        message: 'Đã hủy yêu cầu check-out.',
        type: 'info',
      });
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
              Bắt đầu tính giờ: {new Date(openTimesheet.checkIn).toLocaleString('vi-VN')}
            </Text>
            {pendingCheckOut ? (
              <>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingTitle}>Chờ quản lý duyệt check-out</Text>
                  <Text style={styles.meta}>
                    Gửi lúc: {new Date(pendingCheckOut.requestedAt).toLocaleString('vi-VN')}
                  </Text>
                  <Text style={styles.pendingHint}>
                    Ca làm chỉ kết thúc sau khi quản lý duyệt check-out.
                  </Text>
                </View>
                <BigButton
                  title="Hủy yêu cầu check-out"
                  onPress={handleCancelCheckOutRequest}
                  loading={loading}
                  variant="outline"
                />
              </>
            ) : (
              <BigButton
                title="Gửi yêu cầu check-out"
                onPress={handleRequestCheckOut}
                loading={loading}
              />
            )}
          </>
        ) : pendingCheckIn ? (
          <>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingTitle}>Chờ quản lý duyệt</Text>
              <Text style={styles.meta}>
                Gửi lúc: {new Date(pendingCheckIn.requestedAt).toLocaleString('vi-VN')}
              </Text>
              <Text style={styles.pendingHint}>
                Thời gian ca làm chỉ được tính sau khi quản lý duyệt check-in.
              </Text>
            </View>
            <BigButton
              title="Hủy yêu cầu"
              onPress={handleCancelRequest}
              loading={loading}
              variant="outline"
            />
          </>
        ) : (
          <BigButton title="Gửi yêu cầu check-in" onPress={handleRequestCheckIn} loading={loading} />
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
  pendingBadge: {
    backgroundColor: COLORS.occupied,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: COLORS.warning },
  pendingHint: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  meta: { fontSize: 14, color: COLORS.textSecondary },
  stat: { fontSize: 15, color: COLORS.text },
  salary: { fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
});
