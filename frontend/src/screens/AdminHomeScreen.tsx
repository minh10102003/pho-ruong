import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton } from '../../src/components/BigButton';
import { COLORS } from '../../src/constants';
import { formStyles } from '../../src/styles/formStyles';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/services/api';

export default function AdminHomeScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateManager = async () => {
    if (!fullName.trim() || !phone.trim() || password.length < 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ họ tên, SĐT và mật khẩu (≥6 ký tự)');
      return;
    }
    setLoading(true);
    try {
      await api.createManagerAccount({
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
      });
      Alert.alert('Thành công', 'Đã cấp tài khoản quản lý');
      setFullName('');
      setPhone('');
      setPassword('');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bảng quản trị</Text>
      <Text style={styles.subtitle}>
        UI admin sẽ mở rộng sau. Hiện tại có thể cấp tài khoản quản lý.
      </Text>

      <View style={styles.card}>
        <Text style={formStyles.sectionTitle}>Cấp tài khoản quản lý</Text>

        <Text style={[formStyles.label, formStyles.labelFirst]}>Họ và tên</Text>
        <TextInput
          style={formStyles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nhập họ tên..."
          placeholderTextColor={COLORS.placeholder}
        />

        <Text style={formStyles.label}>Số điện thoại</Text>
        <TextInput
          style={formStyles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="090..."
          placeholderTextColor={COLORS.placeholder}
          keyboardType="phone-pad"
        />

        <Text style={formStyles.label}>Mật khẩu</Text>
        <TextInput
          style={formStyles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Tối thiểu 6 ký tự"
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry
        />

        <BigButton title="Tạo quản lý" onPress={handleCreateManager} loading={loading} />
      </View>

      <BigButton
        title="Đăng xuất"
        onPress={async () => {
          await logout();
          router.replace('/login');
        }}
        variant="outline"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.primaryDark },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
});
