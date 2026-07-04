import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { formatCurrency } from '../utils/format';
import { BigButton } from './BigButton';
import { CartItem, Order } from '../types';
import { getCartLineKey } from '../constants/menu';

type Props = {
  visible: boolean;
  tableLabel: string;
  processingOrders: Order[];
  cart: CartItem[];
  pendingSubtotal: number;
  loading?: boolean;
  actionLabel: string;
  onClose: () => void;
  onIncrease: (item: CartItem) => void;
  onDecrease: (item: CartItem) => void;
  onRemove: (lineKey: string) => void;
  onSaveNote: (lineKey: string, note?: string) => void;
  onSubmit: () => void;
};

export function PosCartModal({
  visible,
  tableLabel,
  processingOrders,
  cart,
  pendingSubtotal,
  loading = false,
  actionLabel,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onSaveNote,
  onSubmit,
}: Props) {
  const [editingLineKey, setEditingLineKey] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (!visible) {
      setEditingLineKey(null);
      setNoteInput('');
    }
  }, [visible]);

  const processingLines = useMemo(() => {
    const map = new Map<
      string,
      {
        lineKey: string;
        name: string;
        selection?: string;
        note?: string;
        quantity: number;
        lineTotal: number;
      }
    >();

    for (const order of processingOrders) {
      for (const item of order.items) {
        const lineKey = getCartLineKey(item.menuItem.id, item.note, item.selection);
        const existing = map.get(lineKey);
        if (existing) {
          existing.quantity += item.quantity;
          existing.lineTotal += Number(item.lineTotal);
        } else {
          map.set(lineKey, {
            lineKey,
            name: item.menuItem.name,
            selection: item.selection,
            note: item.note,
            quantity: item.quantity,
            lineTotal: Number(item.lineTotal),
          });
        }
      }
    }

    return Array.from(map.values());
  }, [processingOrders]);

  const openNoteEditor = (item: CartItem) => {
    setEditingLineKey(item.lineKey);
    setNoteInput(item.note ?? '');
  };

  const closeNoteEditor = () => {
    setEditingLineKey(null);
    setNoteInput('');
  };

  const handleSaveNote = () => {
    if (!editingLineKey) return;
    onSaveNote(editingLineKey, noteInput);
    closeNoteEditor();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Giỏ hàng</Text>
                <Text style={styles.tableText}>{tableLabel}</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {processingLines.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Đang xử lý</Text>
                  {processingLines.map((item) => (
                    <View key={item.lineKey} style={styles.readonlyRow}>
                      <View style={styles.rowInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.selection ? (
                          <Text style={styles.itemSelection}>Lựa chọn: {item.selection}</Text>
                        ) : null}
                        {item.note ? (
                          <Text style={styles.itemNote}>Ghi chú: {item.note}</Text>
                        ) : null}
                        <Text style={styles.itemMeta}>Đã đặt {item.quantity}</Text>
                      </View>
                      <Text style={styles.itemPrice}>{formatCurrency(item.lineTotal)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.section}>
                <View style={styles.pendingHeader}>
                  <Text style={styles.sectionTitle}>Món mới</Text>
                  <Text style={styles.pendingHint}>Chỉnh số lượng và ghi chú từng món</Text>
                </View>

                {cart.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có món mới trong giỏ</Text>
                ) : (
                  cart.map((item) => (
                    <View key={item.lineKey} style={styles.pendingRow}>
                      <View style={styles.rowInfo}>
                        <Text style={styles.itemName}>{item.menuItem.name}</Text>
                        {item.selection ? (
                          <Text style={styles.itemSelection}>Lựa chọn: {item.selection}</Text>
                        ) : null}
                        {item.note ? (
                          <Text style={styles.itemNote}>Ghi chú: {item.note}</Text>
                        ) : null}
                        <TouchableOpacity
                          style={styles.noteButton}
                          onPress={() => openNoteEditor(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={item.note ? 'create-outline' : 'chatbubble-ellipses-outline'}
                            size={14}
                            color={COLORS.primary}
                          />
                          <Text style={styles.noteButtonText}>
                            {item.note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.pendingRight}>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(Number(item.menuItem.price) * item.quantity)}
                        </Text>
                        <View style={styles.pendingActions}>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => onDecrease(item)}
                            disabled={loading}
                          >
                            <Ionicons name="remove" size={18} color={COLORS.primary} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => onIncrease(item)}
                            disabled={loading}
                          >
                            <Ionicons name="add" size={18} color={COLORS.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => onRemove(item.lineKey)}
                            disabled={loading}
                          >
                            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <View>
                <Text style={styles.footerLabel}>Tổng món mới</Text>
                <Text style={styles.footerValue}>{formatCurrency(pendingSubtotal)}</Text>
              </View>
              <BigButton
                title={actionLabel}
                onPress={onSubmit}
                loading={loading}
                disabled={cart.length === 0}
                style={styles.submitButton}
              />
            </View>
        </View>

        {editingLineKey !== null ? (
          <View style={styles.noteOverlay}>
            <TouchableOpacity
              style={styles.noteBackdrop}
              activeOpacity={1}
              onPress={closeNoteEditor}
            />
            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>Ghi chú món</Text>
              <TextInput
                style={styles.noteInput}
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Ví dụ: ít đá, không hành..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                autoFocus
              />
              <View style={styles.noteActions}>
                <BigButton
                  title="Hủy"
                  variant="outline"
                  onPress={closeNoteEditor}
                  style={styles.noteActionBtn}
                />
                <BigButton title="Lưu" onPress={handleSaveNote} style={styles.noteActionBtn} />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  tableText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 10,
  },
  pendingHeader: {
    marginBottom: 10,
  },
  pendingHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  readonlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemNote: {
    fontSize: 13,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginTop: 3,
  },
  itemSelection: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  itemMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noteButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pendingRight: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  submitButton: {
    minWidth: 156,
    minHeight: 52,
  },
  noteOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 30,
  },
  noteBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  noteCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    textAlignVertical: 'top',
    backgroundColor: COLORS.background,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  noteActionBtn: {
    flex: 1,
    minHeight: 48,
  },
});
