import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppSwitch from '../../components/AppSwitch';
import { api } from '../../services/api';
import { BigButton } from '../../components/BigButton';
import { COLORS } from '../../constants';
import { formStyles } from '../../styles/formStyles';
import { confirmAsync } from '../../utils/confirm';
import { ManagedUser } from '../../types/admin';

type FormMode = 'add-manager' | 'add-staff' | 'edit';

const ROLE_LABELS = {
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
} as const;

export default function AdminAccountsScreen() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<FormMode>('edit');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [hourlyRate, setHourlyRate] = useState('25000');
  const [useBlockRounding, setUseBlockRounding] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getManagedUsers();
      setUsers(data);
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setPassword('');
    setHourlyRate('25000');
    setUseBlockRounding(false);
    setIsActive(true);
    setEditingUser(null);
  };

  const openAddManager = () => {
    resetForm();
    setMode('add-manager');
    setModalVisible(true);
  };

  const openAddStaff = () => {
    resetForm();
    setMode('add-staff');
    setModalVisible(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setMode('edit');
    setFullName(user.displayName);
    setPhone(user.phone);
    setPassword('');
    setHourlyRate(user.hourlyRate ? String(user.hourlyRate) : '25000');
    setUseBlockRounding(user.useBlockRounding ?? false);
    setIsActive(user.isActive);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'add-manager') {
        if (password.length < 6) {
          Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
          return;
        }
        await api.createManagerAccount({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
        });
      } else if (mode === 'add-staff') {
        const rate = parseInt(hourlyRate.replace(/\D/g, ''), 10);
        if (password.length < 6) {
          Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
          return;
        }
        if (!rate || rate <= 0) {
          Alert.alert('Lỗi', 'Lương/giờ không hợp lệ');
          return;
        }
        await api.createStaffAccount({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
          hourlyRate: rate,
          useBlockRounding,
        });
      } else if (editingUser) {
        const body: {
          displayName: string;
          phone: string;
          isActive: boolean;
          password?: string;
          hourlyRate?: number;
          useBlockRounding?: boolean;
        } = {
          displayName: fullName.trim(),
          phone: phone.trim(),
          isActive,
        };
        if (password) {
          if (password.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
          }
          body.password = password;
        }
        if (editingUser.role === 'STAFF') {
          const rate = parseInt(hourlyRate.replace(/\D/g, ''), 10);
          if (!rate || rate <= 0) {
            Alert.alert('Lỗi', 'Lương/giờ không hợp lệ');
            return;
          }
          body.hourlyRate = rate;
          body.useBlockRounding = useBlockRounding;
        }
        await api.updateManagedUser(editingUser.id, body);
      }

      setModalVisible(false);
      await loadUsers();
      Alert.alert('Thành công', 'Đã lưu tài khoản');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    const ok = await confirmAsync(
      'Vô hiệu tài khoản',
      `Vô hiệu tài khoản "${user.displayName}"? Người dùng sẽ không đăng nhập được.`
    );
    if (!ok) return;
    try {
      await api.deleteManagedUser(user.id);
      await loadUsers();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const managers = users.filter((u) => u.role === 'MANAGER');
  const staff = users.filter((u) => u.role === 'STAFF');

  const renderUser = (user: ManagedUser) => (
    <View key={user.id} style={[styles.card, !user.isActive && styles.cardInactive]}>
      <TouchableOpacity style={styles.cardMain} onPress={() => openEdit(user)}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{user.displayName}</Text>
          <View style={[styles.badge, user.role === 'MANAGER' ? styles.badgeManager : styles.badgeStaff]}>
            <Text style={styles.badgeText}>{ROLE_LABELS[user.role]}</Text>
          </View>
        </View>
        <Text style={styles.cardPhone}>{user.phone}</Text>
        {user.role === 'STAFF' && user.hourlyRate ? (
          <Text style={styles.cardMeta}>Lương/giờ: {user.hourlyRate.toLocaleString('vi-VN')}đ</Text>
        ) : null}
        {user.role === 'STAFF' && user.useBlockRounding ? (
          <Text style={styles.cardMeta}>Tính giờ theo khối 30 phút</Text>
        ) : null}
        {!user.isActive ? <Text style={styles.inactiveLabel}>Đã vô hiệu</Text> : null}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => void handleDelete(user)} hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadUsers} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.actionRow}>
          <BigButton title="+ Quản lý" onPress={openAddManager} style={styles.actionBtn} />
          <BigButton title="+ Nhân viên" onPress={openAddStaff} style={styles.actionBtn} />
        </View>

        <Text style={styles.sectionTitle}>Quản lý ({managers.length})</Text>
        {managers.map(renderUser)}

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Nhân viên ({staff.length})</Text>
        {staff.map(renderUser)}

        {!loading && users.length === 0 ? (
          <Text style={styles.empty}>Chưa có tài khoản</Text>
        ) : null}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={formStyles.modalTitle}>
                {mode === 'add-manager'
                  ? 'Thêm quản lý'
                  : mode === 'add-staff'
                    ? 'Thêm nhân viên'
                    : 'Sửa tài khoản'}
              </Text>

              <Text style={[formStyles.label, formStyles.labelFirst]}>Họ và tên</Text>
              <TextInput
                style={formStyles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ tên..."
                placeholderTextColor={COLORS.placeholder}
              />

              <Text style={formStyles.label}>Số điện thoại đăng nhập</Text>
              <TextInput
                style={formStyles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="090..."
                placeholderTextColor={COLORS.placeholder}
              />

              <Text style={formStyles.label}>
                {mode === 'edit' ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
              </Text>
              <TextInput
                style={formStyles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="none"
              />

              {(mode === 'add-staff' || (mode === 'edit' && editingUser?.role === 'STAFF')) && (
                <>
                  <Text style={formStyles.label}>Lương/giờ (đ)</Text>
                  <TextInput
                    style={formStyles.input}
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    keyboardType="number-pad"
                    placeholder="25000"
                    placeholderTextColor={COLORS.placeholder}
                  />
                  <View style={styles.switchRow}>
                    <View style={styles.switchTextWrap}>
                      <Text style={styles.switchLabel}>Tính giờ theo khối 30 phút</Text>
                      <Text style={styles.switchHint}>
                        Bật: làm tròn xuống mốc 30 phút khi tính lương.
                      </Text>
                    </View>
                    <AppSwitch value={useBlockRounding} onValueChange={setUseBlockRounding} />
                  </View>
                </>
              )}

              {mode === 'edit' ? (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Đang hoạt động</Text>
                  <AppSwitch value={isActive} onValueChange={setIsActive} />
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <BigButton
                  title="Hủy"
                  onPress={() => setModalVisible(false)}
                  variant="outline"
                  style={styles.modalBtn}
                />
                <BigButton title="Lưu" onPress={() => void handleSave()} loading={saving} style={styles.modalBtn} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  sectionTitleSpaced: { marginTop: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  cardInactive: { opacity: 0.7 },
  cardMain: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeManager: { backgroundColor: COLORS.selected },
  badgeStaff: { backgroundColor: COLORS.occupied },
  badgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primaryDark },
  cardPhone: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  inactiveLabel: { fontSize: 12, color: COLORS.error, marginTop: 4, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  switchTextWrap: { flex: 1 },
  switchHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, minHeight: 48 },
});
