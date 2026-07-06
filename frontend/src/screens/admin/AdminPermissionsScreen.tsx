import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AppSwitch from '../../components/AppSwitch';
import { api } from '../../services/api';
import { BigButton } from '../../components/BigButton';
import { COLORS } from '../../constants';
import { formStyles } from '../../styles/formStyles';
import { AppRole } from '../../types/auth';
import { RoleFeatureGroup } from '../../constants/roleFeatures';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

const ROLE_LABELS: Record<AppRole, string> = {
  STAFF: 'Nhân viên',
  MANAGER: 'Quản lý',
  ADMIN: 'Admin',
};

export default function AdminPermissionsScreen() {
  const [groups, setGroups] = useState<RoleFeatureGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const showToast = useNotificationStore((s) => s.showToast);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRoleFeatures();
      setGroups(data);
      setDirty(false);
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const toggleFeature = (role: AppRole, featureKey: string, enabled: boolean) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.role !== role
          ? group
          : {
              ...group,
              features: group.features.map((feature) =>
                feature.key === featureKey ? { ...feature, enabled } : feature
              ),
            }
      )
    );
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = groups.flatMap((group) =>
        group.features
          .filter((feature) => !feature.locked)
          .map((feature) => ({
            role: group.role,
            featureKey: feature.key,
            enabled: feature.enabled,
          }))
      );
      const data = await api.updateRoleFeatures(updates);
      setGroups(data);
      setDirty(false);
      await refreshUser();
      showToast({
        title: 'Đã lưu phân quyền',
        message: 'Thay đổi áp dụng ngay. Người dùng khác cần tải lại hoặc đăng nhập lại.',
        type: 'success',
      });
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} colors={[COLORS.primary]} />
        }
      >
        <Text style={styles.intro}>
          Bật/tắt màn hình và chức năng cho từng vai trò. Tab &quot;Phân quyền&quot; luôn bật để
          admin không bị khóa.
        </Text>

        {groups.map((group) => (
          <View key={group.role} style={styles.section}>
            <Text style={formStyles.sectionTitle}>{ROLE_LABELS[group.role]}</Text>
            {group.features.map((feature) => (
              <View key={`${group.role}-${feature.key}`} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                  {feature.locked ? (
                    <Text style={styles.lockedHint}>Luôn bật</Text>
                  ) : null}
                </View>
                <AppSwitch
                  value={feature.enabled}
                  onValueChange={(value) => toggleFeature(group.role, feature.key, value)}
                  disabled={feature.locked || saving}
                />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <BigButton
          title={dirty ? 'Lưu thay đổi' : 'Đã lưu'}
          onPress={() => void handleSave()}
          loading={saving}
          disabled={!dirty || saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24, gap: 16 },
  intro: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowText: { flex: 1 },
  featureLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  featureDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  lockedHint: { fontSize: 12, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
