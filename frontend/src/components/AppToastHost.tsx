import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useNotificationStore } from '../store/notificationStore';

const TYPE_COLORS = {
  info: COLORS.primary,
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
} as const;

export default function AppToastHost() {
  const insets = useSafeAreaInsets();
  const toast = useNotificationStore((s) => s.toast);
  const hideToast = useNotificationStore((s) => s.hideToast);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    if (!toast) return;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [toast, opacity, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -24, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) hideToast();
    });
  };

  if (!toast) return null;

  const accent = TYPE_COLORS[toast.type];

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Pressable
          onPress={handleDismiss}
          style={[styles.toast, { borderLeftColor: accent }]}
          accessibilityRole="alert"
        >
          <View style={[styles.iconWrap, { backgroundColor: accent }]}>
            <Ionicons name="notifications" size={18} color="#FFF" />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{toast.title}</Text>
            <Text style={styles.message}>{toast.message}</Text>
          </View>
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 99999,
    ...(Platform.OS === 'web' ? { position: 'fixed' as 'absolute' } : null),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  message: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
