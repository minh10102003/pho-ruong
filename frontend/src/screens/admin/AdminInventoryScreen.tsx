import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { BigButton } from '../../components/BigButton';
import { COLORS } from '../../constants';
import { formStyles } from '../../styles/formStyles';
import { confirmAsync } from '../../utils/confirm';
import { Ingredient } from '../../types';
import { InventoryCategoryItem } from '../../types/admin';
import { formatQuantity } from '../../utils/inventory';
import { formatCurrency, formatReceiptDate } from '../../utils/format';
import { InventoryReceipt } from '../../types';

type InventoryTab = 'categories' | 'ingredients' | 'receipts';

function TabSwitch({
  active,
  onChange,
}: {
  active: InventoryTab;
  onChange: (tab: InventoryTab) => void;
}) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabBtn, active === 'categories' && styles.tabBtnActive]}
        onPress={() => onChange('categories')}
      >
        <Text style={[styles.tabText, active === 'categories' && styles.tabTextActive]}>
          Hạng mục
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabBtn, active === 'ingredients' && styles.tabBtnActive]}
        onPress={() => onChange('ingredients')}
      >
        <Text style={[styles.tabText, active === 'ingredients' && styles.tabTextActive]}>
          Nguyên liệu
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabBtn, active === 'receipts' && styles.tabBtnActive]}
        onPress={() => onChange('receipts')}
      >
        <Text style={[styles.tabText, active === 'receipts' && styles.tabTextActive]}>
          Nhập hàng
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminInventoryScreen() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('categories');
  const [categories, setCategories] = useState<InventoryCategoryItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [receipts, setReceipts] = useState<InventoryReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');

  const [ingredientModal, setIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientCategory, setIngredientCategory] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredientMinStock, setIngredientMinStock] = useState('0');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, items, receiptList] = await Promise.all([
        api.getInventoryCategories(),
        api.getIngredients(),
        api.getReceipts(),
      ]);
      setCategories(cats);
      setIngredients(items);
      setReceipts(receiptList);
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  useEffect(() => {
    if (!ingredientCategory && categoryNames.length > 0) {
      setIngredientCategory(categoryNames[0]);
    }
  }, [categoryNames, ingredientCategory]);

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryModal(true);
  };

  const openEditCategory = (name: string) => {
    setEditingCategory(name);
    setCategoryName(name);
    setCategoryModal(true);
  };

  const saveCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên hạng mục');
      return;
    }
    try {
      if (editingCategory) {
        await api.renameInventoryCategory(editingCategory, name);
      } else {
        await api.createInventoryCategory(name);
      }
      setCategoryModal(false);
      await loadData();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const removeCategory = async (name: string) => {
    const ok = await confirmAsync('Xóa hạng mục', `Xóa hạng mục "${name}"?`);
    if (!ok) return;
    try {
      await api.deleteInventoryCategory(name);
      await loadData();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const openAddIngredient = () => {
    setEditingIngredient(null);
    setIngredientName('');
    setIngredientUnit('');
    setIngredientMinStock('0');
    setIngredientCategory(categoryNames[0] ?? '');
    setIngredientModal(true);
  };

  const openEditIngredient = (item: Ingredient) => {
    setEditingIngredient(item);
    setIngredientName(item.name);
    setIngredientCategory(item.category);
    setIngredientUnit(item.unit);
    setIngredientMinStock(String(Number(item.minStock)));
    setIngredientModal(true);
  };

  const saveIngredient = async () => {
    if (!ingredientName.trim() || !ingredientCategory.trim() || !ingredientUnit.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    const minStock = Number(ingredientMinStock.replace(',', '.'));
    if (!Number.isFinite(minStock) || minStock < 0) {
      Alert.alert('Lỗi', 'Tồn tối thiểu không hợp lệ');
      return;
    }

    try {
      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, {
          name: ingredientName.trim(),
          category: ingredientCategory.trim(),
          unit: ingredientUnit.trim(),
          minStock,
        });
      } else {
        await api.createIngredient({
          name: ingredientName.trim(),
          category: ingredientCategory.trim(),
          unit: ingredientUnit.trim(),
          minStock,
        });
      }
      setIngredientModal(false);
      await loadData();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const removeIngredient = async (item: Ingredient) => {
    const ok = await confirmAsync('Xóa nguyên liệu', `Xóa "${item.name}"?`);
    if (!ok) return;
    try {
      await api.deleteIngredient(item.id);
      await loadData();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const removeReceipt = async (receipt: InventoryReceipt) => {
    const ok = await confirmAsync(
      'Xóa phiếu nhập',
      `Xóa phiếu ${receipt.receiptCode}? Tồn kho sẽ được trừ lại tương ứng.`
    );
    if (!ok) return;
    try {
      await api.deleteReceipt(receipt.id);
      await loadData();
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message);
    }
  };

  const groupedIngredients = useMemo(() => {
    const map = new Map<string, Ingredient[]>();
    for (const item of ingredients) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [ingredients]);

  return (
    <View style={styles.container}>
      <TabSwitch active={activeTab} onChange={setActiveTab} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} colors={[COLORS.primary]} />
        }
      >
        {activeTab === 'categories' ? (
          <>
            <BigButton title="+ Thêm hạng mục" onPress={openAddCategory} />
            {categories.map((cat) => {
              const count = ingredients.filter((i) => i.category === cat.name).length;
              return (
                <View key={cat.name} style={styles.card}>
                  <TouchableOpacity style={styles.cardMain} onPress={() => openEditCategory(cat.name)}>
                    <Text style={styles.cardTitle}>{cat.name}</Text>
                    <Text style={styles.cardMeta}>{count} nguyên liệu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => void removeCategory(cat.name)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {!loading && categories.length === 0 ? (
              <Text style={styles.empty}>Chưa có hạng mục</Text>
            ) : null}
          </>
        ) : activeTab === 'ingredients' ? (
          <>
            <BigButton title="+ Thêm nguyên liệu" onPress={openAddIngredient} />
            {Array.from(groupedIngredients.entries()).map(([category, items]) => (
              <View key={category} style={styles.group}>
                <Text style={styles.groupTitle}>{category}</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <TouchableOpacity style={styles.cardMain} onPress={() => openEditIngredient(item)}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardMeta}>
                        Tồn: {formatQuantity(item.stockQty)} {item.unit} · Min:{' '}
                        {formatQuantity(item.minStock)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => void removeIngredient(item)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
            {!loading && ingredients.length === 0 ? (
              <Text style={styles.empty}>Chưa có nguyên liệu</Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.receiptHint}>Lịch sử phiếu nhập hàng — có thể xóa nếu nhập nhầm.</Text>
            {receipts.map((receipt) => (
              <View key={receipt.id} style={styles.receiptCard}>
                <View style={styles.receiptMain}>
                  <Text style={styles.receiptCode}>{receipt.receiptCode}</Text>
                  <Text style={styles.cardTitle}>
                    {receipt.ingredient.category} / {receipt.ingredient.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {formatReceiptDate(receipt.receivedAt)} · {formatQuantity(receipt.quantity)}{' '}
                    {receipt.ingredient.unit} · NCC: {receipt.supplier}
                  </Text>
                  <Text style={styles.receiptCost}>{formatCurrency(receipt.totalCost)}</Text>
                </View>
                <TouchableOpacity onPress={() => void removeReceipt(receipt)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
            {!loading && receipts.length === 0 ? (
              <Text style={styles.empty}>Chưa có phiếu nhập</Text>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal visible={categoryModal} transparent animationType="slide" onRequestClose={() => setCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={formStyles.modalTitle}>
              {editingCategory ? 'Sửa hạng mục' : 'Thêm hạng mục'}
            </Text>
            <Text style={[formStyles.label, formStyles.labelFirst]}>Tên hạng mục</Text>
            <TextInput
              style={formStyles.input}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="VD: Thịt, Rau củ..."
              placeholderTextColor={COLORS.placeholder}
            />
            <View style={styles.modalActions}>
              <BigButton title="Hủy" onPress={() => setCategoryModal(false)} variant="outline" style={styles.modalBtn} />
              <BigButton title="Lưu" onPress={() => void saveCategory()} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={ingredientModal} transparent animationType="slide" onRequestClose={() => setIngredientModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={formStyles.modalTitle}>
                {editingIngredient ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}
              </Text>

              <Text style={[formStyles.label, formStyles.labelFirst]}>Hạng mục</Text>
              <View style={styles.chipRow}>
                {categoryNames.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.chip, ingredientCategory === name && styles.chipActive]}
                    onPress={() => setIngredientCategory(name)}
                  >
                    <Text style={[styles.chipText, ingredientCategory === name && styles.chipTextActive]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={formStyles.label}>Tên nguyên liệu</Text>
              <TextInput
                style={formStyles.input}
                value={ingredientName}
                onChangeText={setIngredientName}
                placeholder="Nhập tên..."
                placeholderTextColor={COLORS.placeholder}
              />

              <Text style={formStyles.label}>Đơn vị</Text>
              <TextInput
                style={formStyles.input}
                value={ingredientUnit}
                onChangeText={setIngredientUnit}
                placeholder="kg, lít, gói..."
                placeholderTextColor={COLORS.placeholder}
              />

              <Text style={formStyles.label}>Tồn tối thiểu</Text>
              <TextInput
                style={formStyles.input}
                value={ingredientMinStock}
                onChangeText={setIngredientMinStock}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.placeholder}
              />

              <View style={styles.modalActions}>
                <BigButton title="Hủy" onPress={() => setIngredientModal(false)} variant="outline" style={styles.modalBtn} />
                <BigButton title="Lưu" onPress={() => void saveIngredient()} style={styles.modalBtn} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selected,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primaryDark, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  group: { gap: 8 },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  receiptHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  receiptMain: { flex: 1 },
  receiptCode: { fontWeight: '700', color: COLORS.primary },
  receiptCost: { fontWeight: '700', color: COLORS.success, marginTop: 6 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, padding: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalScroll: { flexGrow: 1, justifyContent: 'center' },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selected,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.primaryDark },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, minHeight: 48 },
});
