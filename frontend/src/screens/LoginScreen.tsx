import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton } from '../components/BigButton';
import { COLORS } from '../constants';
import { formStyles } from '../styles/formStyles';
import { useAuthStore, getRoleHomePath } from '../store/authStore';

const LOGIN_LOGO = require('../../assets/images/login-logo.jpg');
const LOGIN_BG = require('../../assets/images/login-bg.png');

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
    <View style={styles.root}>
      <Image
        source={LOGIN_BG}
        style={[styles.backgroundImage, Platform.OS === 'web' ? styles.backgroundBlurWeb : null]}
        blurRadius={Platform.OS === 'web' ? 0 : 12}
        resizeMode="cover"
      />
      <View style={styles.backgroundTint} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Image source={LOGIN_LOGO} style={styles.logo} resizeMode="contain" />
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

          <BigButton
            title="Đăng nhập"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundBlurWeb: {
    transform: [{ scale: 1.08 }],
    ...(Platform.OS === 'web'
      ? ({ filter: 'blur(10px)' } as unknown as ImageStyle)
      : null),
  },
  backgroundTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 16,
    padding: 24,
    paddingTop: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  logo: {
    width: '100%',
    height: 72,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    marginTop: 24,
  },
});
