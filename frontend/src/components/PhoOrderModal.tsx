import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BigButton } from './BigButton';
import { COLORS } from '../constants';
import { formatPhoMeatNote, getPhoSizeMeta, sortPhoMeatItems } from '../constants/menu';
import { formatCurrency } from '../utils/format';
import { MenuItem } from '../types';

interface Props {
  visible: boolean;
  phoSizeItems: MenuItem[];
  phoMeatItems: MenuItem[];
  onClose: () => void;
  onConfirm: (menuItem: MenuItem, meats: string[]) => void;
}

export function PhoOrderModal({
  visible,
  phoSizeItems,
  phoMeatItems,
  onClose,
  onConfirm,
}: Props) {
  const [selectedSize, setSelectedSize] = useState<MenuItem | null>(null);
  const [selectedMeats, setSelectedMeats] = useState<string[]>([]);

  const sizeMeta = selectedSize ? getPhoSizeMeta(selectedSize.name) : null;
  const sortedMeatItems = useMemo(() => sortPhoMeatItems(phoMeatItems), [phoMeatItems]);
  const availableMeatNames = useMemo(
    () => new Set(sortedMeatItems.map((item) => item.name)),
    [sortedMeatItems]
  );

  useEffect(() => {
    if (!visible) {
      setSelectedSize(null);
      setSelectedMeats([]);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedSize && !phoSizeItems.some((item) => item.id === selectedSize.id)) {
      setSelectedSize(null);
      setSelectedMeats([]);
    }
  }, [phoSizeItems, selectedSize]);

  useEffect(() => {
    setSelectedMeats((prev) => prev.filter((meat) => availableMeatNames.has(meat)));
  }, [availableMeatNames]);

  const handleClose = () => {
    setSelectedSize(null);
    setSelectedMeats([]);
    onClose();
  };

  const toggleMeat = (meat: string) => {
    if (!sizeMeta) return;
    setSelectedMeats((prev) => {
      if (prev.includes(meat)) {
        return prev.filter((m) => m !== meat);
      }
      if (prev.length >= sizeMeta.maxMeats) return prev;
      return [...prev, meat];
    });
  };

  const handleConfirm = () => {
    if (!selectedSize || selectedMeats.length === 0) return;
    onConfirm(selectedSize, selectedMeats);
    setSelectedSize(null);
    setSelectedMeats([]);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Chọn phở</Text>

          <Text style={styles.sectionLabel}>Loại tô</Text>
          {phoSizeItems.length === 0 ? (
            <Text style={styles.emptyText}>Không có loại tô phở đang bán</Text>
          ) : (
            <View style={styles.sizeRow}>
              {phoSizeItems.map((item) => {
                const meta = getPhoSizeMeta(item.name);
                const selected = selectedSize?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.sizeBtn, selected && styles.sizeBtnActive]}
                    onPress={() => {
                      setSelectedSize(item);
                      setSelectedMeats([]);
                    }}
                  >
                    <Text style={[styles.sizeLabel, selected && styles.sizeLabelActive]}>
                      {meta.label}
                    </Text>
                    <Text style={[styles.sizePrice, selected && styles.sizeLabelActive]}>
                      {formatCurrency(item.price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {sizeMeta && (
            <>
              <Text style={styles.sectionLabel}>
                Chọn thịt (tối đa {sizeMeta.maxMeats} loại)
              </Text>
              {sortedMeatItems.length === 0 ? (
                <Text style={styles.emptyText}>Không có loại thịt đang bán</Text>
              ) : (
                <View style={styles.meatGrid}>
                  {sortedMeatItems.map((item) => {
                    const meat = item.name;
                    const selected = selectedMeats.includes(meat);
                    const disabled =
                      !selected && selectedMeats.length >= sizeMeta.maxMeats;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.meatChip,
                          selected && styles.meatChipActive,
                          disabled && styles.meatChipDisabled,
                        ]}
                        onPress={() => toggleMeat(meat)}
                        disabled={disabled}
                      >
                        <Text
                          style={[
                            styles.meatText,
                            selected && styles.meatTextActive,
                            disabled && styles.meatTextDisabled,
                          ]}
                        >
                          {meat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {selectedMeats.length > 0 && (
                <Text style={styles.preview}>
                  {sizeMeta.label}: {formatPhoMeatNote(selectedMeats)}
                </Text>
              )}
            </>
          )}

          <View style={styles.actions}>
            <BigButton title="Hủy" onPress={handleClose} variant="outline" style={styles.btn} />
            <BigButton
              title="Thêm vào đơn"
              onPress={handleConfirm}
              disabled={
                !selectedSize ||
                selectedMeats.length === 0 ||
                sortedMeatItems.length === 0
              }
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 10,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  sizeRow: { gap: 8, marginBottom: 8 },
  sizeBtn: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  sizeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selected,
  },
  sizeLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sizeLabelActive: { color: COLORS.primaryDark },
  sizePrice: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  meatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  meatChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  meatChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  meatChipDisabled: { opacity: 0.4 },
  meatText: { fontSize: 15, fontWeight: '600', color: COLORS.text, textTransform: 'capitalize' },
  meatTextActive: { color: COLORS.primaryDark },
  meatTextDisabled: { color: COLORS.textSecondary },
  preview: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: { flex: 1, minHeight: 48 },
});
