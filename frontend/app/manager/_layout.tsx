import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';
import { SettingsHeaderButton } from '../../src/components/SettingsHeaderButton';
import { CheckInNotificationLayer } from '../../src/components/CheckInNotificationLayer';
import { useEmployeeStore } from '../../src/store/employeeStore';
import { useRoleFeatures } from '../../src/hooks/useRoleFeatures';

const TAB_BAR_HEIGHT = 76;
const TAB_ICON_SIZE = 28;

function tabHref(enabled: boolean) {
  return enabled ? undefined : null;
}

export default function ManagerLayout() {
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
          height: TAB_BAR_HEIGHT,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 2,
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => (hasFeature('settings') ? <SettingsHeaderButton /> : null),
      }}
    >
      <Tabs.Screen
        name="(pos)"
        options={{
          title: 'Menu',
          headerShown: false,
          href: tabHref(hasFeature('pos')),
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant" size={TAB_ICON_SIZE} color={color} />
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
        name="employees"
        options={{
          title: 'Nhân viên',
          href: tabHref(hasFeature('employees')),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={TAB_ICON_SIZE} color={color} />
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
        name="settings"
        options={{
          title: 'Cài đặt',
          href: null,
        }}
      />
    </Tabs>
    </View>
  );
}
