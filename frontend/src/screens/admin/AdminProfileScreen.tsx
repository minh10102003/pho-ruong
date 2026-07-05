import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { BigButton } from '../../components/BigButton';
import { COLORS } from '../../constants';
import { formStyles } from '../../styles/formStyles';

export default function AdminProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', 'Đã đổi mật khẩu');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <Text style={styles.profileLabel}>Quản trị viên</Text>
        <Text style={styles.profileName}>{user?.displayName ?? '—'}</Text>
        <Text style={styles.profilePhone}>{user?.phone ?? '—'}</Text>
      </View>

      <View style={styles.passwordCard}>
        <Text style={formStyles.sectionTitle}>Đổi mật khẩu</Text>

        <Text style={[formStyles.label, formStyles.labelFirst]}>Mật khẩu hiện tại</Text>
        <TextInput
          style={formStyles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholder="Nhập mật khẩu hiện tại"
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
        />

        <Text style={formStyles.label}>Mật khẩu mới</Text>
        <TextInput
          style={formStyles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="Ít nhất 6 ký tự"
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
        />

        <Text style={formStyles.label}>Xác nhận mật khẩu mới</Text>
        <TextInput
          style={formStyles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Nhập lại mật khẩu mới"
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
        />

        <BigButton
          title="Lưu mật khẩu mới"
          onPress={handleChangePassword}
          loading={loading}
          style={styles.savePasswordBtn}
        />
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
    gap: 4,
  },
  profileLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  profileName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  profilePhone: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  passwordCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  savePasswordBtn: { marginTop: 8 },
});
