import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { BigButton } from '../components/BigButton';
import { COLORS } from '../constants';

export default function StaffSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <Text style={styles.label}>Nhân viên</Text>
        <Text style={styles.name}>{user?.displayName ?? '—'}</Text>
        <Text style={styles.phone}>{user?.phone ?? '—'}</Text>
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
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  phone: { fontSize: 15, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
});
