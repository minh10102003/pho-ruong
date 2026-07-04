import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useMenuSettingsStore } from '../store/menuSettingsStore';
import { BigButton } from '../components/BigButton';
import { COLORS, MENU_ADMIN_CATEGORY_ORDER, MENU_CATEGORY_LABELS, MENU_CATEGORY_OPTIONS } from '../constants';
import { formatCurrency } from '../utils/format';
import { formStyles } from '../styles/formStyles';
import { MenuItem } from '../types';

type FormMode = 'add' | 'edit';

function MenuItemFormModal({
  visible,
  mode,
  item,
  onClose,
  onSave,
  loading,
}: {
  visible: boolean;
  mode: FormMode;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (data: { name: string; price: number; category: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>('side');

  useEffect(() => {
    if (visible) {
      setName(item?.name ?? '');
      setPrice(item ? String(Number(item.price)) : '');
      setCategory(item?.category ?? 'side');
    }
  }, [visible, item]);

  const handleSave = () => {
    const parsedPrice = parseInt(price.replace(/\D/g, ''), 10);
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên món');
      return;
    }
    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
      return;
    }
    onSave({ name: name.trim(), price: parsedPrice, category });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={formStyles.modalTitle}>
            {mode === 'add' ? 'Thêm món mới' : 'Sửa món'}
          </Text>

          <Text style={[formStyles.label, formStyles.labelFirst]}>Tên món</Text>
          <TextInput
            style={formStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên món..."
            placeholderTextColor={COLORS.placeholder}
          />

          <Text style={formStyles.label}>Giá (đ)</Text>
          <TextInput
            style={formStyles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="number-pad"
            placeholder="VD: 45000"
            placeholderTextColor={COLORS.placeholder}
          />

          <Text style={formStyles.label}>Danh mục</Text>
          <View style={styles.categoryRow}>
            {MENU_CATEGORY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.categoryChip,
                  category === opt.value && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(opt.value)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === opt.value && styles.categoryChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.modalActions, formStyles.formAction]}>
            <BigButton title="Hủy" onPress={onClose} variant="outline" style={styles.modalBtn} />
            <BigButton
              title="Lưu"
              onPress={handleSave}
              loading={loading}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Màn hình cài đặt thực đơn
export default function SettingsScreen() {
  const { items, loading, fetchItems, createItem, updateItem, toggleActive } =
    useMenuSettingsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    }

    return MENU_ADMIN_CATEGORY_ORDER.filter((c) => grouped.has(c)).map((category) => ({
      title: MENU_CATEGORY_LABELS[category] || category,
      data: grouped.get(category) ?? [],
    }));
  }, [items]);

  const openAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSave = async (data: { name: string; price: number; category: string }) => {
    try {
      if (editingItem) {
        await updateItem(editingItem.id, data);
        Alert.alert('Thành công', 'Đã cập nhật món');
      } else {
        await createItem(data);
        Alert.alert('Thành công', 'Đã thêm món mới');
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const handleToggleActive = async (item: MenuItem, isActive: boolean) => {
    try {
      await toggleActive(item.id, isActive);
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchItems} colors={[COLORS.primary]} />
        }
        ListHeaderComponent={
          <BigButton title="+ Thêm món mới" onPress={openAdd} style={styles.addBtn} />
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.row, !item.isActive && styles.rowInactive]}>
            <TouchableOpacity
              style={styles.rowInfo}
              onPress={() => openEdit(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowName, !item.isActive && styles.rowNameInactive]}>
                {item.name}
              </Text>
              <Text style={styles.rowPrice}>{formatCurrency(item.price)}</Text>
              {!item.isActive && <Text style={styles.hiddenLabel}>Đang ẩn trên menu</Text>}
            </TouchableOpacity>
            <Switch
              value={item.isActive}
              onValueChange={(value) => handleToggleActive(item, value)}
              trackColor={{ false: COLORS.border, true: COLORS.secondary }}
              thumbColor={item.isActive ? COLORS.primary : COLORS.textSecondary}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Chưa có món trong thực đơn</Text> : null
        }
      />

      <MenuItemFormModal
        visible={modalVisible}
        mode={editingItem ? 'edit' : 'add'}
        item={editingItem}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, paddingBottom: 32 },
  addBtn: { marginBottom: 16 },
  sectionHeader: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowInfo: { flex: 1, marginRight: 12 },
  rowName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  rowNameInactive: { color: COLORS.textSecondary },
  rowPrice: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '700' },
  rowInactive: { opacity: 0.75 },
  hiddenLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 40 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    paddingTop: 20,
  },
  categoryRow: { gap: 8 },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selected,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  categoryChipTextActive: { color: COLORS.primaryDark },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, minHeight: 48 },
});
