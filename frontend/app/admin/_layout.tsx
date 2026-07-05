import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';
import { CheckInNotificationLayer } from '../../src/components/CheckInNotificationLayer';
import { useEmployeeStore } from '../../src/store/employeeStore';

const TAB_ICON_SIZE = 22;

export default function AdminLayout() {
  const pendingCount =
    useEmployeeStore((s) => s.pendingCheckInRequests.length) +
    useEmployeeStore((s) => s.pendingCheckOutRequests.length);

  return (
    <View style={{ flex: 1 }}>
      <CheckInNotificationLayer />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            height: 72,
            paddingTop: 4,
            paddingBottom: 6,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Món',
            tabBarIcon: ({ color }) => (
              <Ionicons name="restaurant" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Kho',
            tabBarIcon: ({ color }) => (
              <Ionicons name="cube" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Đơn',
            tabBarIcon: ({ color }) => (
              <Ionicons name="receipt" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="employees"
          options={{
            title: 'Nhân viên',
            tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
            tabBarIcon: ({ color }) => (
              <Ionicons name="time" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Báo cáo',
            tabBarIcon: ({ color }) => (
              <Ionicons name="bar-chart" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Tài khoản',
            tabBarIcon: ({ color }) => (
              <Ionicons name="people" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Cá nhân',
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
