import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton } from '../components/BigButton';
import { COLORS } from '../constants';
import { formStyles } from '../styles/formStyles';
import { useAuthStore, getRoleHomePath } from '../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const user = await login(phone.trim(), password);
      router.replace(getRoleHomePath(user.role));
    } catch (e) {
      Alert.alert('Đăng nhập thất bại', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>PHỞ RUỘNG</Text>
        <Text style={styles.subtitle}>Đăng nhập hệ thống</Text>

        <Text style={[formStyles.label, formStyles.labelFirst]}>Số điện thoại</Text>
        <TextInput
          style={formStyles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="090..."
          placeholderTextColor={COLORS.placeholder}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <Text style={formStyles.label}>Mật khẩu</Text>
        <TextInput
          style={formStyles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu"
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry
        />

        <BigButton title="Đăng nhập" onPress={handleLogin} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
});
