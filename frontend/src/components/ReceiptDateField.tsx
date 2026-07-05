import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { formStyles } from '../styles/formStyles';
import {
  ReceiptDateMode,
  WEEKDAY_LABELS,
  buildCalendarCells,
  clampToToday,
  formatMonthYear,
  formatReceiptDayLabel,
  isFutureDay,
  isSameDay,
  shiftMonth,
  startOfDay,
} from '../utils/receiptDate';

interface ReceiptDateFieldProps {
  mode: ReceiptDateMode;
  value: Date;
  onModeChange: (mode: ReceiptDateMode) => void;
  onChange: (date: Date) => void;
}

export function ReceiptDateField({
  mode,
  value,
  onModeChange,
  onChange,
}: ReceiptDateFieldProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const openPicker = () => {
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
    setPickerVisible(true);
  };

  const selectDay = (date: Date) => {
    if (isFutureDay(date)) return;
    onChange(startOfDay(date));
    setPickerVisible(false);
  };

  const calendarCells = buildCalendarCells(viewYear, viewMonth);

  return (
    <View style={styles.wrapper}>
      <Text style={[formStyles.label, formStyles.labelFirst]}>Ngày nhập kho</Text>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'today' && styles.modeChipActive]}
          onPress={() => onModeChange('today')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="today-outline"
            size={18}
            color={mode === 'today' ? COLORS.onPrimary : COLORS.primary}
          />
          <Text style={[styles.modeChipText, mode === 'today' && styles.modeChipTextActive]}>
            Hôm nay
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeChip, mode === 'custom' && styles.modeChipActive]}
          onPress={() => {
            onModeChange('custom');
            openPicker();
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={mode === 'custom' ? COLORS.onPrimary : COLORS.primary}
          />
          <Text style={[styles.modeChipText, mode === 'custom' && styles.modeChipTextActive]}>
            Chọn ngày
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.dateDisplay}
        onPress={() => {
          if (mode === 'custom') {
            openPicker();
          }
        }}
        activeOpacity={mode === 'custom' ? 0.85 : 1}
      >
        <View style={styles.dateDisplayLeft}>
          <View style={styles.dateIconWrap}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.dateCaption}>
              {mode === 'today' ? 'Ngày nhập' : 'Ngày đã chọn'}
            </Text>
            <Text style={styles.dateValue}>
              {mode === 'today' ? formatReceiptDayLabel(today) : formatReceiptDayLabel(value)}
            </Text>
          </View>
        </View>
        {mode === 'custom' ? (
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        ) : null}
      </TouchableOpacity>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Chọn ngày nhập kho</Text>

            <View style={styles.monthHeader}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => {
                  const next = shiftMonth(viewYear, viewMonth, -1);
                  setViewYear(next.year);
                  setViewMonth(next.month);
                }}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
              </TouchableOpacity>

              <Text style={styles.monthLabel}>{formatMonthYear(viewYear, viewMonth)}</Text>

              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => {
                  const next = shiftMonth(viewYear, viewMonth, 1);
                  setViewYear(next.year);
                  setViewMonth(next.month);
                }}
              >
                <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarCells.map((cell, index) => {
                if (!cell) return <View key={`empty-${index}`} style={styles.dayCell} />;

                const inMonth = cell.getMonth() === viewMonth;
                const selected = isSameDay(cell, value);
                const isToday = isSameDay(cell, today);
                const disabled = isFutureDay(cell);

                return (
                  <TouchableOpacity
                    key={cell.toISOString()}
                    style={[
                      styles.dayCell,
                      selected && styles.dayCellSelected,
                      isToday && !selected && styles.dayCellToday,
                      disabled && styles.dayCellDisabled,
                    ]}
                    onPress={() => selectDay(cell)}
                    disabled={disabled}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !inMonth && styles.dayTextMuted,
                        selected && styles.dayTextSelected,
                        disabled && styles.dayTextDisabled,
                      ]}
                    >
                      {cell.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.todayShortcut}
              onPress={() => {
                onChange(today);
                setPickerVisible(false);
              }}
            >
              <Text style={styles.todayShortcutText}>Dùng hôm nay</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function createInitialReceiptDate(): Date {
  return clampToToday(startOfDay(new Date()));
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  modeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modeChipTextActive: {
    color: COLORS.onPrimary,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.highlight,
  },
  dateDisplayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCaption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 74, 36, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 14,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.highlight,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285714%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayCellDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayTextMuted: {
    color: COLORS.textSecondary,
  },
  dayTextSelected: {
    color: COLORS.onPrimary,
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: COLORS.textSecondary,
  },
  todayShortcut: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.highlight,
  },
  todayShortcutText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
});
