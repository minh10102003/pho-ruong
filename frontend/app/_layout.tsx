import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants';
import { installAudioUnlock } from '../src/utils/sounds';
import AppLoadingScreen from '../src/components/AppLoadingScreen';

const TAB_BAR_HEIGHT = 76;
const TAB_ICON_SIZE = 28;
const SPLASH_MIN_MS = 1200;

// Layout chính - Tab navigation cho 4 module
export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    installAudioUnlock();
    const timer = setTimeout(() => setReady(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <AppLoadingScreen />;
  }

  return (
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
      }}
    >
      <Tabs.Screen
        name="(pos)"
        options={{
          title: 'Menu',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant" size={TAB_ICON_SIZE} color={color} />
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
        name="inventory"
        options={{
          title: 'Kho',
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Nhân viên',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={TAB_ICON_SIZE} color={color} />
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
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
