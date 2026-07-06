import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';
import { CheckInNotificationLayer } from '../../src/components/CheckInNotificationLayer';
import { useEmployeeStore } from '../../src/store/employeeStore';
import { useRoleFeatures } from '../../src/hooks/useRoleFeatures';

const TAB_ICON_SIZE = 22;

function tabHref(enabled: boolean) {
  return enabled ? undefined : null;
}

export default function AdminLayout() {
  const { hasFeature } = useRoleFeatures();
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
            href: tabHref(hasFeature('menu')),
            tabBarIcon: ({ color }) => (
              <Ionicons name="restaurant" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Kho',
            href: tabHref(hasFeature('inventory')),
            tabBarIcon: ({ color }) => (
              <Ionicons name="cube" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Đơn',
            href: tabHref(hasFeature('orders')),
            tabBarIcon: ({ color }) => (
              <Ionicons name="receipt" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="employees"
          options={{
            title: 'Nhân viên',
            href: tabHref(hasFeature('employees')),
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
            href: tabHref(hasFeature('reports')),
            tabBarIcon: ({ color }) => (
              <Ionicons name="bar-chart" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Tài khoản',
            href: tabHref(hasFeature('accounts')),
            tabBarIcon: ({ color }) => (
              <Ionicons name="people" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="permissions"
          options={{
            title: 'Phân quyền',
            href: tabHref(hasFeature('permissions')),
            tabBarIcon: ({ color }) => (
              <Ionicons name="shield-checkmark" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Cá nhân',
            href: tabHref(hasFeature('profile')),
            tabBarIcon: ({ color }) => (
              <Ionicons name="person" size={TAB_ICON_SIZE} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
