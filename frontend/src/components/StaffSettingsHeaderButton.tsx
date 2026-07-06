import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useRoleFeatures } from '../hooks/useRoleFeatures';

const ICON_SIZE = 24;

export function StaffSettingsHeaderButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasFeature } = useRoleFeatures();

  if (!hasFeature('settings')) {
    return null;
  }

  if (pathname === '/staff/settings') {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push('/staff/settings')}
      hitSlop={12}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Cài đặt"
    >
      <Ionicons name="settings-outline" size={ICON_SIZE} color="#FFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 12,
    padding: 4,
  },
});
