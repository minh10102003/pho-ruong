import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BigButton } from '../components/BigButton';
import { COLORS } from '../constants';

// Fallback route - luồng chính đã chuyển sang popup giỏ hàng trong màn Chọn món
export default function PosOrderScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Giỏ hàng đã chuyển sang màn Chọn món</Text>
        <Text style={styles.body}>
          Dùng icon giỏ hàng nổi ở góc dưới màn menu để xem món đang xử lý, thêm món mới,
          sửa ghi chú từng món và gửi đơn mà không cần rời khỏi màn hình.
        </Text>
        <BigButton title="Quay lại Chọn món" onPress={() => router.replace('/menu')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
});
