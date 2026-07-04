import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../constants';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

// Nút bấm lớn, tối ưu cho màn hình cảm ứng iOS
export const BigButton: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}) => {
  const bgColor =
    variant === 'primary'
      ? COLORS.accent
      : variant === 'secondary'
        ? COLORS.secondary
        : variant === 'danger'
          ? COLORS.error
          : 'transparent';

  const textColor =
    variant === 'outline'
      ? COLORS.primary
      : variant === 'secondary'
        ? COLORS.primaryDark
        : variant === 'primary'
          ? COLORS.onAccent
          : COLORS.onPrimary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor },
        variant === 'outline' && styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  outline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
