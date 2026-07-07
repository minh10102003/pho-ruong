import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEmployeeStore } from '../store/employeeStore';
import { useEmployeeScreenRefresh } from '../hooks/useEmployeeScreenRefresh';
import { BigButton } from '../components/BigButton';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/format';
import { formStyles, FORM_SPACING } from '../styles/formStyles';
import { confirmAsync } from '../utils/confirm';
import { useNotificationStore } from '../store/notificationStore';
import { useRoleFeatures } from '../hooks/useRoleFeatures';
import { Employee } from '../types';

type FormMode = 'add' | 'edit';

function getCurrentPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function shiftPayrollMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function formatPayrollPeriod(year: number, month: number) {
  return `Tháng ${month}/${year}`;
}

function EmployeeFormModal({
  visible,
  mode,
  employee,
  onClose,
  onSave,
  loading,
}: {
  visible: boolean;
  mode: FormMode;
  employee: Employee | null;
  onClose: () => void;
  onSave: (data: {
    fullName: string;
    phone?: string;
    password?: string;
    hourlyRate: number;
    useBlockRounding?: boolean;
  }) => void;
  loading: boolean;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [useBlockRounding, setUseBlockRounding] = useState(false);

  useEffect(() => {
    if (visible) {
      setFullName(employee?.fullName ?? '');
      setPhone(employee?.phone ?? '');
      setPassword('');
      setHourlyRate(employee ? String(Number(employee.hourlyRate)) : '');
      setUseBlockRounding(employee?.useBlockRounding ?? false);
    }
  }, [visible, employee]);

  const handleSave = () => {
    const parsedRate = parseInt(hourlyRate.replace(/\D/g, ''), 10);
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhân viên');
      return;
    }
    if (mode === 'add' && !phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại đăng nhập');
      return;
    }
    if (mode === 'add' && password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (!parsedRate || parsedRate <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập lương/giờ hợp lệ');
      return;
    }
    onSave({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      password: mode === 'add' ? password : undefined,
      hourlyRate: parsedRate,
      useBlockRounding,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={26} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <Text style={formStyles.modalTitle}>
            {mode === 'add' ? 'Thêm nhân viên + tài khoản' : 'Cập nhật nhân viên'}
          </Text>

          <Text style={[formStyles.label, formStyles.labelFirst]}>Họ tên</Text>
          <TextInput
            style={formStyles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên..."
            placeholderTextColor={COLORS.placeholder}
          />

          <Text style={formStyles.label}>
            {mode === 'add' ? 'Số điện thoại đăng nhập' : 'Số điện thoại (tuỳ chọn)'}
          </Text>
          <TextInput
            style={formStyles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="090..."
            placeholderTextColor={COLORS.placeholder}
            keyboardType="phone-pad"
            editable={mode === 'add'}
          />

          {mode === 'add' && (
            <>
              <Text style={formStyles.label}>Mật khẩu đăng nhập</Text>
              <TextInput
                style={formStyles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={COLORS.placeholder}
                secureTextEntry
              />
            </>
          )}

          <Text style={formStyles.label}>Lương / giờ (đ)</Text>
          <TextInput
            style={formStyles.input}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholder="VD: 25000"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="number-pad"
          />

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={formStyles.label}>Tính giờ theo khối 30 phút</Text>
              <Text style={styles.switchHint}>
                Bật: làm tròn xuống mốc 30 phút (VD checkout 14:45 tính đến 14:30). Tắt: tính theo phút thực tế.
              </Text>
            </View>
            <Switch
              value={useBlockRounding}
              onValueChange={setUseBlockRounding}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <BigButton
            title="Lưu"
            onPress={handleSave}
            loading={loading}
            style={formStyles.formAction}
          />
        </View>
      </View>
    </Modal>
  );
}

// Màn hình Chấm công & Bảng lương
export default function EmployeeScreen() {
  const {
    employees,
    openTimesheets,
    pendingCheckInRequests,
    pendingCheckOutRequests,
    payroll,
    loading,
    createEmployee,
    createStaffAccount,
    updateEmployee,
    fetchPayroll,
    approveCheckInRequest,
    rejectCheckInRequest,
    approveCheckOutRequest,
    rejectCheckOutRequest,
    checkIn,
    checkOut,
    fetchOpenTimesheets,
  } = useEmployeeStore();

  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actingDirectEmployeeId, setActingDirectEmployeeId] = useState<string | null>(null);
  const { hasFeature } = useRoleFeatures();
  const canDirectAttendance = hasFeature('direct_attendance');
  const showToast = useNotificationStore((s) => s.showToast);

  const currentPeriod = getCurrentPeriod();
  const [payrollYear, setPayrollYear] = useState(currentPeriod.year);
  const [payrollMonth, setPayrollMonth] = useState(currentPeriod.month);

  const isCurrentPayrollMonth =
    payrollYear === currentPeriod.year && payrollMonth === currentPeriod.month;

  const payrollWithHours = payroll.filter((entry) => entry.totalHours > 0);
  const totalPayroll = payrollWithHours.reduce((sum, entry) => sum + entry.totalSalary, 0);

  useEmployeeScreenRefresh(payrollYear, payrollMonth);

  useEffect(() => {
    fetchPayroll(payrollYear, payrollMonth);
  }, [fetchPayroll, payrollYear, payrollMonth]);

  const goToPreviousMonth = () => {
    const next = shiftPayrollMonth(payrollYear, payrollMonth, -1);
    setPayrollYear(next.year);
    setPayrollMonth(next.month);
  };

  const goToNextMonth = () => {
    const next = shiftPayrollMonth(payrollYear, payrollMonth, 1);
    setPayrollYear(next.year);
    setPayrollMonth(next.month);
  };

  const goToCurrentMonth = () => {
    const current = getCurrentPeriod();
    setPayrollYear(current.year);
    setPayrollMonth(current.month);
  };

  const openAddForm = () => {
    setFormMode('add');
    setEditingEmployee(null);
    setFormVisible(true);
  };

  const openEditForm = (employee: Employee) => {
    setFormMode('edit');
    setEditingEmployee(employee);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingEmployee(null);
  };

  const handleSaveEmployee = async (data: {
    fullName: string;
    phone?: string;
    password?: string;
    hourlyRate: number;
    useBlockRounding?: boolean;
  }) => {
    try {
      if (formMode === 'add') {
        await createStaffAccount({
          fullName: data.fullName,
          phone: data.phone!,
          password: data.password!,
          hourlyRate: data.hourlyRate,
          useBlockRounding: data.useBlockRounding,
        });
        Alert.alert('Thành công', 'Đã tạo nhân viên và tài khoản đăng nhập');
      } else if (editingEmployee) {
        await updateEmployee(editingEmployee.id, data);
        await fetchPayroll(payrollYear, payrollMonth);
        Alert.alert('Thành công', 'Đã cập nhật nhân viên');
      }
      closeForm();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleApproveCheckIn = async (requestId: string, employeeName: string) => {
    setActingRequestId(requestId);
    try {
      await approveCheckInRequest(requestId);
      showToast({
        title: 'Đã duyệt',
        message: `${employeeName} đã bắt đầu ca làm.`,
        type: 'success',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setActingRequestId(null);
    }
  };

  const handleRejectCheckIn = async (requestId: string, employeeName: string) => {
    const confirmed = await confirmAsync(
      'Từ chối check-in',
      `Xác nhận từ chối yêu cầu của ${employeeName}?`
    );
    if (!confirmed) return;

    setActingRequestId(requestId);
    try {
      await rejectCheckInRequest(requestId);
      showToast({
        title: 'Đã từ chối',
        message: `Đã từ chối check-in của ${employeeName}.`,
        type: 'warning',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setActingRequestId(null);
    }
  };

  const handleApproveCheckOut = async (requestId: string, employeeName: string) => {
    setActingRequestId(requestId);
    try {
      await approveCheckOutRequest(requestId);
      await fetchPayroll(payrollYear, payrollMonth);
      showToast({
        title: 'Đã duyệt',
        message: `${employeeName} đã kết thúc ca làm.`,
        type: 'success',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setActingRequestId(null);
    }
  };

  const handleRejectCheckOut = async (requestId: string, employeeName: string) => {
    const confirmed = await confirmAsync(
      'Từ chối check-out',
      `Xác nhận từ chối yêu cầu check-out của ${employeeName}?`
    );
    if (!confirmed) return;

    setActingRequestId(requestId);
    try {
      await rejectCheckOutRequest(requestId);
      showToast({
        title: 'Đã từ chối',
        message: `Đã từ chối check-out của ${employeeName}.`,
        type: 'warning',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setActingRequestId(null);
    }
  };

  const handleDirectCheckIn = async (employee: Employee) => {
    setActingDirectEmployeeId(employee.id);
    try {
      await checkIn(employee.id);
      await fetchOpenTimesheets();
      await fetchPayroll(payrollYear, payrollMonth);
      showToast({
        title: 'Đã chấm công',
        message: `Đã check-in trực tiếp cho ${employee.fullName}.`,
        type: 'success',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setActingDirectEmployeeId(null);
    }
  };

  const handleDirectCheckOut = async (employee: Employee) => {
    const open = openTimesheets[employee.id];
    if (!open) return;
    setActingDirectEmployeeId(employee.id);
    try {
      await checkOut(open.id);
      await fetchOpenTimesheets();
      await fetchPayroll(payrollYear, payrollMonth);
      showToast({
        title: 'Đã chấm công',
        message: `Đã check-out trực tiếp cho ${employee.fullName}.`,
        type: 'success',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setActingDirectEmployeeId(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>
          Duyệt check-in
          {pendingCheckInRequests.length > 0 ? ` (${pendingCheckInRequests.length})` : ''}
        </Text>
        {pendingCheckInRequests.length === 0 ? (
          <Text style={styles.emptyInline}>Không có yêu cầu chờ duyệt.</Text>
        ) : (
          pendingCheckInRequests.map((request) => {
            const isActing = actingRequestId === request.id;
            return (
              <View key={request.id} style={styles.approvalCard}>
                <Text style={styles.empName}>{request.employee.fullName}</Text>
                <Text style={styles.approvalMeta}>
                  Gửi lúc: {new Date(request.requestedAt).toLocaleString('vi-VN')}
                </Text>
                <View style={styles.approvalActions}>
                  <BigButton
                    title="Duyệt"
                    onPress={() => handleApproveCheckIn(request.id, request.employee.fullName)}
                    loading={isActing}
                    disabled={actingRequestId !== null && !isActing}
                    style={styles.approvalBtn}
                  />
                  <BigButton
                    title="Từ chối"
                    onPress={() => void handleRejectCheckIn(request.id, request.employee.fullName)}
                    variant="outline"
                    loading={isActing}
                    disabled={actingRequestId !== null && !isActing}
                    style={styles.approvalBtn}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>
          Duyệt check-out
          {pendingCheckOutRequests.length > 0 ? ` (${pendingCheckOutRequests.length})` : ''}
        </Text>
        {pendingCheckOutRequests.length === 0 ? (
          <Text style={styles.emptyInline}>Không có yêu cầu chờ duyệt.</Text>
        ) : (
          pendingCheckOutRequests.map((request) => {
            const isActing = actingRequestId === request.id;
            return (
              <View key={request.id} style={styles.approvalCard}>
                <Text style={styles.empName}>{request.employee.fullName}</Text>
                <Text style={styles.approvalMeta}>
                  Gửi lúc: {new Date(request.requestedAt).toLocaleString('vi-VN')}
                </Text>
                <View style={styles.approvalActions}>
                  <BigButton
                    title="Duyệt"
                    onPress={() => handleApproveCheckOut(request.id, request.employee.fullName)}
                    loading={isActing}
                    disabled={actingRequestId !== null && !isActing}
                    style={styles.approvalBtn}
                  />
                  <BigButton
                    title="Từ chối"
                    onPress={() => void handleRejectCheckOut(request.id, request.employee.fullName)}
                    variant="outline"
                    loading={isActing}
                    disabled={actingRequestId !== null && !isActing}
                    style={styles.approvalBtn}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      {canDirectAttendance ? (
        <View style={styles.section}>
          <Text style={formStyles.sectionTitle}>Chấm công trực tiếp (không cần request)</Text>
          {employees.length === 0 ? (
            <Text style={styles.emptyInline}>Chưa có nhân viên.</Text>
          ) : (
            employees.map((employee) => {
              const openSheet = openTimesheets[employee.id];
              const isActing = actingDirectEmployeeId === employee.id;
              return (
                <View key={`direct-${employee.id}`} style={styles.empCard}>
                  <View style={styles.empCardInfo}>
                    <Text style={styles.empName}>{employee.fullName}</Text>
                    <Text style={styles.empMeta}>
                      {openSheet
                        ? `Đang trong ca từ ${new Date(openSheet.checkIn).toLocaleString('vi-VN')}`
                        : 'Chưa vào ca'}
                    </Text>
                  </View>
                  {openSheet ? (
                    <BigButton
                      title="Check-out"
                      onPress={() => void handleDirectCheckOut(employee)}
                      loading={isActing}
                      disabled={actingDirectEmployeeId !== null && !isActing}
                      style={styles.directActionBtn}
                    />
                  ) : (
                    <BigButton
                      title="Check-in"
                      onPress={() => void handleDirectCheckIn(employee)}
                      loading={isActing}
                      disabled={actingDirectEmployeeId !== null && !isActing}
                      style={styles.directActionBtn}
                    />
                  )}
                </View>
              );
            })
          )}
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={formStyles.sectionTitleInline}>Quản lý nhân viên</Text>
          <BigButton title="+ Thêm" onPress={openAddForm} style={styles.addBtn} />
        </View>

        {employees.length === 0 ? (
          <Text style={styles.empty}>Chưa có nhân viên. Bấm &quot;+ Thêm&quot; để tạo mới.</Text>
        ) : (
          employees.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.empCard}
              onPress={() => openEditForm(item)}
              activeOpacity={0.7}
            >
              <View style={styles.empCardInfo}>
                <Text style={styles.empName}>{item.fullName}</Text>
                <Text style={styles.empMeta}>{formatCurrency(item.hourlyRate)}/giờ</Text>
                {item.useBlockRounding ? (
                  <Text style={styles.empPhone}>Tính giờ theo khối 30 phút</Text>
                ) : null}
                {item.phone ? <Text style={styles.empPhone}>{item.phone}</Text> : null}
              </View>
              <Text style={styles.editHint}>Sửa</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>Bảng lương</Text>

        <View style={styles.periodNav}>
          <TouchableOpacity
            style={styles.periodNavBtn}
            onPress={goToPreviousMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.periodLabel}>{formatPayrollPeriod(payrollYear, payrollMonth)}</Text>

          <TouchableOpacity
            style={styles.periodNavBtn}
            onPress={goToNextMonth}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {!isCurrentPayrollMonth && (
          <TouchableOpacity onPress={goToCurrentMonth} style={styles.currentMonthBtn}>
            <Text style={styles.currentMonthText}>Về tháng hiện tại</Text>
          </TouchableOpacity>
        )}

        {employees.length === 0 ? (
          <Text style={styles.empty}>Thêm nhân viên để xem bảng lương.</Text>
        ) : payrollWithHours.length === 0 ? (
          <Text style={styles.empty}>
            Chưa có giờ công trong {formatPayrollPeriod(payrollYear, payrollMonth).toLowerCase()}.
          </Text>
        ) : (
          <>
            {payrollWithHours.map((entry) => (
              <View key={entry.employee.id} style={styles.payrollCard}>
                <Text style={styles.empName}>{entry.employee.fullName}</Text>
                <View style={styles.payrollRow}>
                  <Text>Giờ công:</Text>
                  <Text style={styles.value}>{entry.totalHours}h</Text>
                </View>
                <View style={styles.payrollRow}>
                  <Text>Lương/giờ:</Text>
                  <Text style={styles.value}>{formatCurrency(entry.hourlyRate)}</Text>
                </View>
                <View style={styles.payrollRow}>
                  <Text style={styles.salaryLabel}>Tổng lương:</Text>
                  <Text style={styles.salaryValue}>{formatCurrency(entry.totalSalary)}</Text>
                </View>
              </View>
            ))}

            <View style={styles.payrollTotalRow}>
              <Text style={styles.payrollTotalLabel}>Tổng chi lương tháng</Text>
              <Text style={styles.payrollTotalValue}>{formatCurrency(totalPayroll)}</Text>
            </View>
          </>
        )}
      </View>

      <EmployeeFormModal
        visible={formVisible}
        mode={formMode}
        employee={editingEmployee}
        onClose={closeForm}
        onSave={handleSaveEmployee}
        loading={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: {
    backgroundColor: COLORS.surface,
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FORM_SPACING.sectionHeaderBottom,
  },
  addBtn: { minHeight: 40, paddingVertical: 8, paddingHorizontal: 16, minWidth: 90 },
  empCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  empCardInfo: { flex: 1 },
  empMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  empPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  editHint: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  emptyInline: { color: COLORS.textSecondary, fontSize: 14 },
  approvalCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.occupied,
    marginBottom: 10,
    gap: 8,
  },
  approvalMeta: { fontSize: 13, color: COLORS.textSecondary },
  approvalActions: { flexDirection: 'row', gap: 8 },
  approvalBtn: { flex: 1 },
  directActionBtn: { minWidth: 110, minHeight: 40, paddingHorizontal: 12, paddingVertical: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  switchTextWrap: { flex: 1 },
  switchHint: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, marginTop: 2 },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  periodNavBtn: {
    padding: 4,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  currentMonthBtn: {
    alignSelf: 'center',
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  currentMonthText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  payrollCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  empName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  payrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  value: { fontWeight: '600' },
  salaryLabel: { fontWeight: '700', fontSize: 15 },
  salaryValue: { fontWeight: '700', fontSize: 15, color: COLORS.primary },
  payrollTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  payrollTotalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  payrollTotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    paddingTop: 44,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
});
