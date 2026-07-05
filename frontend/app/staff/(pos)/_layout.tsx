import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants';

// Stack navigation trong tab POS: Bàn → Món → Đơn
export default function PosLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Chọn bàn' }} />
      <Stack.Screen
        name="menu"
        options={{ title: 'Chọn món', headerBackTitle: 'Chọn bàn' }}
      />
      <Stack.Screen
        name="order"
        options={{ title: 'Đơn hàng', headerBackTitle: 'Chọn món' }}
      />
    </Stack>
  );
}
