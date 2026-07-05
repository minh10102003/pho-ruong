import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { usePosStore } from '../store/posStore';
import { TableIcon } from '../components/TableIcon';
import { CounterIcon } from '../components/CounterIcon';
import { useOrderRealtime } from '../hooks/useOrderRealtime';
import { COLORS } from '../constants';
import {
  isCounterTable,
  INDOOR_TABLE_LAYOUT,
  INDOOR_COLUMNS,
} from '../constants/tables';

// Màn hình chọn bàn - sơ đồ bàn theo layout quán
export default function PosTableScreen() {
  const { width } = useWindowDimensions();
  const gap = 10;
  const padding = 32;
  const cellSize = Math.floor(
    (width - padding - (INDOOR_COLUMNS - 1) * gap) / INDOOR_COLUMNS
  );

  const { setSelectedTable } = usePosStore();
  const { activeOrders, hasActiveOrders } = useOrderRealtime();

  const { occupiedTables, counterOccupied } = useMemo(() => {
    const set = new Set<number>();
    let counter = false;
    for (const order of activeOrders) {
      if (!order.tableNumber) continue;
      if (isCounterTable(order.tableNumber)) {
        counter = true;
        continue;
      }
      const num = parseInt(order.tableNumber, 10);
      if (!Number.isNaN(num)) set.add(num);
    }
    return { occupiedTables: set, counterOccupied: counter };
  }, [activeOrders]);

  const handleSelectTable = (table: number) => {
    setSelectedTable(table);
    router.push('menu');
  };

  const renderTableCell = (
    table: number,
    options?: { width?: number; height?: number }
  ) => {
    const occupied = occupiedTables.has(table);
    const cellWidth = options?.width ?? cellSize;
    const cellHeight = options?.height ?? cellSize;
    return (
      <TouchableOpacity
        key={table}
        style={[
          styles.tableCell,
          { width: cellWidth, height: cellHeight },
          occupied && styles.tableOccupied,
        ]}
        onPress={() => handleSelectTable(table)}
        activeOpacity={0.75}
      >
        <TableIcon size={Math.min(cellWidth, cellHeight) * 0.38} />
        <Text style={[styles.tableNumber, occupied && styles.tableNumberOccupied]}>
          {table}
        </Text>
        {occupied && <Text style={styles.occupiedTag}>Đang dùng</Text>}
      </TouchableOpacity>
    );
  };

  const renderEmptyCell = (key: string) => (
    <View key={key} pointerEvents="none" style={{ width: cellSize, height: cellSize }} />
  );

  const gridWidth = cellSize * INDOOR_COLUMNS + gap * (INDOOR_COLUMNS - 1);
  const leftColumnsWidth = cellSize * 2 + gap;
  const indoorRestRows = INDOOR_TABLE_LAYOUT.slice(1);

  const renderCounterCell = () => (
    <View
      pointerEvents="none"
      style={[
        styles.counterCell,
        styles.counterCellFill,
        counterOccupied && styles.counterOccupied,
      ]}
    >
      <CounterIcon size={cellSize * 0.42} animated={hasActiveOrders} />
      <Text style={styles.counterText}>Bếp</Text>
      {counterOccupied && <Text style={styles.occupiedTag}>Đang dùng</Text>}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.hint}>Chọn bàn để bắt đầu gọi món</Text>

      <View style={[styles.floorPlan, { width: gridWidth }]}>
        <View style={[styles.topSection, { gap }]}>
          <View style={{ width: leftColumnsWidth }}>
            <Text style={styles.zoneTitle}>Ngoài sân</Text>
            <View style={[styles.row, { gap }]}>
              {renderTableCell(11)}
              {renderEmptyCell('outdoor-spacer')}
            </View>

            <Text style={[styles.zoneTitle, styles.zoneTitleIndoor]}>Trong nhà</Text>
            <View style={[styles.row, { gap }]}>
              {renderTableCell(1)}
              {renderTableCell(5)}
            </View>
          </View>

            <View style={[styles.counterColumn, { width: cellSize }]}>
            <Text style={[styles.zoneTitle, styles.zoneTitleSpacer]}>Ngoài sân</Text>
            <View style={styles.counterCellWrap}>{renderCounterCell()}</View>
          </View>
        </View>

        {indoorRestRows.map((row, rowIndex) => (
          <View key={`row-${rowIndex + 1}`} style={[styles.row, { gap }]}>
            {row.map((table, colIndex) =>
              table !== null
                ? renderTableCell(table)
                : renderEmptyCell(`empty-${rowIndex + 1}-${colIndex}`)
            )}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendFree]} />
          <Text style={styles.legendText}>Bàn trống</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, styles.legendBusy]} />
          <Text style={styles.legendText}>Đang có đơn</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  hint: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    paddingLeft: 4,
  },
  zoneTitleIndoor: {
    marginTop: 24,
  },
  floorPlan: {
    gap: 10,
    alignSelf: 'center',
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  counterColumn: {
    flexDirection: 'column',
  },
  zoneTitleSpacer: {
    opacity: 0,
  },
  counterCellWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  counterCell: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterCellFill: {
    flex: 1,
    borderRadius: 12,
  },
  counterOccupied: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.occupied,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 4,
  },
  tableCell: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableOccupied: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.occupied,
  },
  tableNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  tableNumberOccupied: {
    color: COLORS.warning,
  },
  occupiedTag: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '600',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendFree: { backgroundColor: COLORS.surface },
  legendBusy: { backgroundColor: COLORS.occupied, borderColor: COLORS.warning },
  legendText: { fontSize: 13, color: COLORS.textSecondary },
});
