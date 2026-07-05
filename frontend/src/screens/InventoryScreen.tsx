import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useInventoryStore } from '../store/inventoryStore';
import { BigButton } from '../components/BigButton';
import {
  ReceiptDateField,
  createInitialReceiptDate,
} from '../components/ReceiptDateField';
import { COLORS } from '../constants';
import { formatCurrency, formatReceiptDate } from '../utils/format';
import { formStyles } from '../styles/formStyles';
import { formatQuantity, isLowStock, parseQuantity } from '../utils/inventory';
import {
  ReceiptDateMode,
  toReceivedAtIso,
} from '../utils/receiptDate';

function parsePositiveNumber(value: string) {
  return Number(value.replace(',', '.').trim());
}

// Màn hình Quản lý Kho & Phiếu nhập hàng
export default function InventoryScreen() {
  const { ingredients, receipts, loading, fetchIngredients, fetchReceipts, createReceipt } =
    useInventoryStore();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const [receiptDateMode, setReceiptDateMode] = useState<ReceiptDateMode>('today');
  const [receiptDate, setReceiptDate] = useState(createInitialReceiptDate);

  useEffect(() => {
    fetchIngredients();
    fetchReceipts();
  }, []);

  const groupedIngredients = useMemo(() => {
    const map = new Map<string, typeof ingredients>();
    for (const ingredient of ingredients) {
      const category = ingredient.category?.trim() || 'Khác';
      const list = map.get(category) ?? [];
      list.push(ingredient);
      map.set(category, list);
    }
    return map;
  }, [ingredients]);

  const categories = useMemo(() => Array.from(groupedIngredients.keys()), [groupedIngredients]);

  useEffect(() => {
    if (!categories.length) {
      setSelectedCategory('');
      setSelectedIngredientId('');
      return;
    }

    setSelectedCategory((current) => (current && categories.includes(current) ? current : categories[0]));
  }, [categories]);

  const ingredientsInSelectedCategory = useMemo(
    () => groupedIngredients.get(selectedCategory) ?? [],
    [groupedIngredients, selectedCategory]
  );

  useEffect(() => {
    if (!ingredientsInSelectedCategory.length) {
      setSelectedIngredientId('');
      return;
    }

    setSelectedIngredientId((current) =>
      ingredientsInSelectedCategory.some((item) => item.id === current)
        ? current
        : ingredientsInSelectedCategory[0].id
    );
  }, [ingredientsInSelectedCategory]);

  const selectedIngredient =
    ingredients.find((ingredient) => ingredient.id === selectedIngredientId) ?? null;

  const handleCreateReceipt = async () => {
    if (!selectedIngredient) {
      Alert.alert('Lỗi', 'Vui lòng chọn món nhập');
      return;
    }
    if (!supplier.trim() || !quantity.trim() || !unitPrice.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin phiếu nhập');
      return;
    }

    const parsedQuantity = parsePositiveNumber(quantity);
    const parsedUnitPrice = parsePositiveNumber(unitPrice);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Lỗi', 'Số lượng không hợp lệ');
      return;
    }
    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0) {
      Alert.alert('Lỗi', 'Đơn giá không hợp lệ');
      return;
    }

    try {
      await createReceipt({
        ingredientId: selectedIngredient.id,
        quantity: parsedQuantity,
        unitPrice: parsedUnitPrice,
        supplier: supplier.trim(),
        note: note.trim() || undefined,
        receivedAt: toReceivedAtIso(receiptDateMode, receiptDate),
      });
      setQuantity('');
      setUnitPrice('');
      setSupplier('');
      setNote('');
      setReceiptDateMode('today');
      setReceiptDate(createInitialReceiptDate());
      Alert.alert('Thành công', 'Đã tạo phiếu nhập kho');
    } catch (e) {
      Alert.alert('Lỗi', (e as Error).message || 'Không thể tạo phiếu nhập');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>Chọn hạng mục nhập kho</Text>

        {categories.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có danh mục nhập kho</Text>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsRow}
            >
              {categories.map((category) => {
                const active = category === selectedCategory;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryTab, active && styles.categoryTabActive]}
                    onPress={() => setSelectedCategory(category)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.itemList}>
              {ingredientsInSelectedCategory.map((item) => {
                const active = item.id === selectedIngredientId;
                const low = isLowStock(item.stockQty, item.minStock);
                const minStock = parseQuantity(item.minStock);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.ingredientCard,
                      active && styles.ingredientCardActive,
                      low && styles.lowStock,
                    ]}
                    onPress={() => setSelectedIngredientId(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingName}>{item.name}</Text>
                      <Text style={styles.ingUnit}>Đơn vị: {item.unit}</Text>
                      <Text style={styles.ingStock}>
                        Tồn: {formatQuantity(item.stockQty)} {item.unit}
                        {minStock > 0 && ` · Min: ${formatQuantity(item.minStock)} ${item.unit}`}
                        {low ? ' · Sắp hết' : ''}
                      </Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>Tạo phiếu nhập kho</Text>
        {selectedIngredient ? (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedLabel}>Đang chọn</Text>
            <Text style={styles.selectedName}>
              {selectedIngredient.category} / {selectedIngredient.name}
            </Text>
            <Text style={styles.selectedMeta}>
              Tồn hiện tại: {formatQuantity(selectedIngredient.stockQty)} {selectedIngredient.unit}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Chọn một món trong danh mục để nhập kho</Text>
        )}

        <View style={formStyles.fieldGroup}>
          <ReceiptDateField
            mode={receiptDateMode}
            value={receiptDate}
            onModeChange={setReceiptDateMode}
            onChange={setReceiptDate}
          />
          <TextInput
            style={formStyles.input}
            placeholder={`Số lượng${selectedIngredient ? ` (${selectedIngredient.unit})` : ''}`}
            placeholderTextColor={COLORS.placeholder}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={formStyles.input}
            placeholder="Đơn giá (VND)"
            placeholderTextColor={COLORS.placeholder}
            value={unitPrice}
            onChangeText={setUnitPrice}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={formStyles.input}
            placeholder="Nhà cung cấp"
            placeholderTextColor={COLORS.placeholder}
            value={supplier}
            onChangeText={setSupplier}
          />
          <TextInput
            style={formStyles.input}
            placeholder="Ghi chú (tuỳ chọn)"
            placeholderTextColor={COLORS.placeholder}
            value={note}
            onChangeText={setNote}
          />
          <BigButton
            title="Tạo phiếu nhập"
            onPress={handleCreateReceipt}
            loading={loading}
            disabled={!selectedIngredient}
            style={formStyles.formActionTight}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={formStyles.sectionTitle}>Lịch sử nhập hàng</Text>
        {receipts.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có phiếu nhập</Text>
        ) : (
          receipts.map((r) => (
            <View key={r.id} style={styles.receiptCard}>
              <Text style={styles.receiptCode}>{r.receiptCode}</Text>
              <Text style={styles.receiptName}>
                {r.ingredient.category} / {r.ingredient.name}
              </Text>
              <Text style={styles.receiptMeta}>
                {formatReceiptDate(r.receivedAt)} · {formatQuantity(r.quantity)} {r.ingredient.unit} · NCC:{' '}
                {r.supplier}
              </Text>
              <Text style={styles.receiptCost}>{formatCurrency(r.totalCost)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: {
    backgroundColor: COLORS.surface,
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingVertical: 16,
    fontSize: 14,
  },
  tabsScroll: {
    marginBottom: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryTab: {
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderColor: COLORS.primary,
    borderBottomColor: COLORS.primary,
  },
  categoryTabText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  categoryTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  itemList: {
    gap: 10,
  },
  ingredientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  ingredientCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.highlight,
  },
  lowStock: {
    backgroundColor: COLORS.highlight,
  },
  ingredientInfo: { flex: 1, marginRight: 12 },
  ingName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  ingUnit: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  ingStock: { fontSize: 13, color: COLORS.textSecondary, marginTop: 3 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  radioActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  selectedCard: {
    backgroundColor: COLORS.highlight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  selectedLabel: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  selectedMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  receiptCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptCode: { fontWeight: '700', color: COLORS.primary },
  receiptName: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  receiptMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  receiptCost: { fontWeight: '600', color: COLORS.success, marginTop: 4 },
});
