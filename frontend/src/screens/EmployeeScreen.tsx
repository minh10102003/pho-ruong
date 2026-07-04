import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEmployeeStore } from '../store/employeeStore';
import { useEmployeeRealtime } from '../hooks/useEmployeeRealtime';
import { BigButton } from '../components/BigButton';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/format';
import { formStyles, FORM_SPACING } from '../styles/formStyles';
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
    hourlyRate: number;
  }) => void;
  loading: boolean;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  useEffect(() => {
    if (visible) {
      setFullName(employee?.fullName ?? '');
      setPhone(employee?.phone ?? '');
      setHourlyRate(employee ? String(Number(employee.hourlyRate)) : '');
    }
  }, [visible, employee]);

  const handleSave = () => {
    const parsedRate = parseInt(hourlyRate.replace(/\D/g, ''), 10);
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhân viên');
      return;
    }
    if (!parsedRate || parsedRate <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập lương/giờ hợp lệ');
      return;
    }
    onSave({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      hourlyRate: parsedRate,
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
            {mode === 'add' ? 'Thêm nhân viên' : 'Cập nhật nhân viên'}
          </Text>

          <Text style={[formStyles.label, formStyles.labelFirst]}>Họ tên</Text>
          <TextInput
            style={formStyles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên..."
            placeholderTextColor={COLORS.placeholder}
          />

          <Text style={formStyles.label}>Số điện thoại (tuỳ chọn)</Text>
          <TextInput
            style={formStyles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="090..."
            placeholderTextColor={COLORS.placeholder}
            keyboardType="phone-pad"
          />

          <Text style={formStyles.label}>Lương / giờ (đ)</Text>
          <TextInput
            style={formStyles.input}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholder="VD: 25000"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="number-pad"
          />

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
    payroll,
    loading,
    createEmployee,
    updateEmployee,
    checkIn,
    checkOut,
    fetchPayroll,
    syncCurrentTimesheet,
  } = useEmployeeStore();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const currentPeriod = getCurrentPeriod();
  const [payrollYear, setPayrollYear] = useState(currentPeriod.year);
  const [payrollMonth, setPayrollMonth] = useState(currentPeriod.month);

  const isCurrentPayrollMonth =
    payrollYear === currentPeriod.year && payrollMonth === currentPeriod.month;

  const payrollWithHours = payroll.filter((entry) => entry.totalHours > 0);
  const totalPayroll = payrollWithHours.reduce((sum, entry) => sum + entry.totalSalary, 0);
  const selectedOpenTimesheet = selectedEmployeeId ? openTimesheets[selectedEmployeeId] : null;
  const canCheckIn = Boolean(selectedEmployeeId) && !selectedOpenTimesheet;
  const canCheckOut = Boolean(selectedOpenTimesheet);

  useEmployeeRealtime(selectedEmployeeId || undefined, payrollYear, payrollMonth);

  useEffect(() => {
    fetchPayroll(payrollYear, payrollMonth);
  }, [fetchPayroll, payrollYear, payrollMonth]);

  const handleSelectEmployee = (employeeId: string) => {
    if (selectedEmployeeId === employeeId) {
      setSelectedEmployeeId('');
      syncCurrentTimesheet('');
      return;
    }
    setSelectedEmployeeId(employeeId);
    syncCurrentTimesheet(employeeId);
  };

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
    hourlyRate: number;
  }) => {
    try {
      if (formMode === 'add') {
        await createEmployee(data);
        Alert.alert('Thành công', 'Đã thêm nhân viên');
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

  const handleCheckIn = async () => {
    if (!selectedEmployeeId) {
      Alert.alert('Lỗi', 'Vui lòng chọn nhân viên');
      return;
    }
    try {
      await checkIn(selectedEmployeeId);
      Alert.alert('Thành công', 'Check-in thành công!');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedOpenTimesheet) return;
    try {
      await checkOut(selectedOpenTimesheet.id);
      await fetchPayroll(payrollYear, payrollMonth);
      Alert.alert('Thành công', 'Check-out thành công!');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container}>
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
                {item.phone ? <Text style={styles.empPhone}>{item.phone}</Text> : null}
              </View>
              <Text style={styles.editHint}>Sửa</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>Chấm công</Text>

        {employees.length === 0 ? (
          <Text style={styles.empty}>Thêm nhân viên trước khi chấm công.</Text>
        ) : (
          <>
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isCheckedIn = Boolean(openTimesheets[item.id]);
                return (
                  <BigButton
                    title={isCheckedIn ? `${item.fullName} · Đang làm` : item.fullName}
                    onPress={() => handleSelectEmployee(item.id)}
                    variant={selectedEmployeeId === item.id ? 'primary' : 'outline'}
                    style={styles.empBtn}
                  />
                );
              }}
            />

            <View style={styles.checkRow}>
              <BigButton
                title="Check-in"
                onPress={handleCheckIn}
                loading={loading}
                disabled={!canCheckIn}
                style={{ flex: 1, marginRight: 8 }}
              />
              <BigButton
                title="Check-out"
                onPress={handleCheckOut}
                variant="secondary"
                disabled={!canCheckOut}
                loading={loading}
                style={{ flex: 1 }}
              />
            </View>

            {selectedOpenTimesheet && (
              <Text style={styles.checkInfo}>
                Đang làm việc từ:{' '}
                {new Date(selectedOpenTimesheet.checkIn).toLocaleTimeString('vi-VN')}
              </Text>
            )}
          </>
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
  empBtn: { marginBottom: 8 },
  checkRow: { flexDirection: 'row', marginTop: 12 },
  checkInfo: {
    marginTop: 12,
    textAlign: 'center',
    color: COLORS.success,
    fontWeight: '600',
  },
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
