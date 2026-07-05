import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePosStore } from '../store/posStore';
import { MenuItemButton } from '../components/MenuItemButton';
import { PhoOrderModal } from '../components/PhoOrderModal';
import { PosCartModal } from '../components/PosCartModal';
import { TableIcon } from '../components/TableIcon';
import { CounterIcon } from '../components/CounterIcon';
import { COLORS, CATEGORY_LABELS, CATEGORY_ORDER } from '../constants';
import {
  COUNTER_TABLE_NUMBER,
  getTableDisplayLabel,
  orderMatchesTable,
} from '../constants/tables';
import {
  PHO_SIZE_CATEGORY,
  SIDE_CATEGORY,
  filterPhoToppingItems,
  formatPhoMeatNote,
  formatPhoMeatSummary,
  formatPhoSizeSummary,
} from '../constants/menu';
import { formatCurrency } from '../utils/format';
import { CartItem, MenuItem } from '../types';
import { useOrderRealtime } from '../hooks/useOrderRealtime';
import { isProcessingOrder } from '../utils/posCart';
import { playOrderAnnouncement } from '../utils/sounds';
import { useOrderManageStore } from '../store/orderManageStore';

function chunkRow<T>(items: T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

type SectionRow =
  | { type: 'pho' }
  | { type: 'items'; items: MenuItem[] };

type MenuSection = {
  title: string;
  category: string;
  data: SectionRow[];
};

export default function PosMenuScreen() {
  const FLY_CHIP_SIZE = 48;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = isTablet ? 4 : 2;
  const sectionGap = isTablet ? 10 : 6;
  const cartPulse = useRef(new Animated.Value(1)).current;
  const flyProgress = useRef(new Animated.Value(0)).current;
  const screenRef = useRef<View | null>(null);
  const cartAnchorRef = useRef<View | null>(null);
  const cartIconRef = useRef<View | null>(null);
  const phoAnchorRef = useRef<View | null>(null);
  const menuItemRefs = useRef<Record<string, View | null>>({});

  const {
    menuItems,
    cart,
    selectedTable,
    isCartOpen,
    loading,
    fetchMenu,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItemNote,
    openCart,
    closeCart,
    submitOrder,
  } = usePosStore();
  const { activeOrders } = useOrderRealtime();
  const [phoModalVisible, setPhoModalVisible] = useState(false);
  const [flyItem, setFlyItem] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (selectedTable === null) {
        router.replace('/');
        return;
      }
      fetchMenu();
    }, [fetchMenu, selectedTable])
  );

  const phoSizeItems = useMemo(
    () => menuItems.filter((item) => item.category === PHO_SIZE_CATEGORY),
    [menuItems]
  );

  const phoMeatItems = useMemo(
    () => menuItems.filter((item) => item.category === SIDE_CATEGORY),
    [menuItems]
  );

  const phoToppingItems = useMemo(
    () => filterPhoToppingItems(phoMeatItems),
    [phoMeatItems]
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>();

    for (const item of menuItems) {
      if (item.category === PHO_SIZE_CATEGORY) continue;
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    }

    const result: MenuSection[] = [];
    if (phoSizeItems.length > 0) {
      result.push({
        title: CATEGORY_LABELS.pho,
        category: 'pho',
        data: [{ type: 'pho' }],
      });
    }

    const otherCategories = [
      ...CATEGORY_ORDER.filter((category) => category !== 'pho' && grouped.has(category)),
      ...[...grouped.keys()].filter(
        (category) => !CATEGORY_ORDER.includes(category as (typeof CATEGORY_ORDER)[number])
      ),
    ];

    for (const category of otherCategories) {
      const items = grouped.get(category) ?? [];
      result.push({
        title: CATEGORY_LABELS[category] || category,
        category,
        data: chunkRow(items, numColumns).map((row) => ({
          type: 'items' as const,
          items: row,
        })),
      });
    }

    return result;
  }, [menuItems, numColumns, phoSizeItems.length]);

  const tableActiveOrders = useMemo(() => {
    if (selectedTable === null) return [];
    return activeOrders.filter((order) => orderMatchesTable(order, selectedTable));
  }, [activeOrders, selectedTable]);

  const tableProcessingOrders = useMemo(
    () => tableActiveOrders.filter(isProcessingOrder),
    [tableActiveOrders]
  );

  const pendingItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pendingSubtotal = cart.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0
  );

  const processingQtyByMenuItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of tableProcessingOrders) {
      for (const item of order.items) {
        map.set(item.menuItem.id, (map.get(item.menuItem.id) ?? 0) + item.quantity);
      }
    }
    return map;
  }, [tableProcessingOrders]);

  const pendingQtyByMenuItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) {
      map.set(item.menuItem.id, (map.get(item.menuItem.id) ?? 0) + item.quantity);
    }
    return map;
  }, [cart]);

  const processingItemsCount = useMemo(
    () =>
      tableProcessingOrders.reduce(
        (sum, order) => sum + order.items.reduce((inner, item) => inner + item.quantity, 0),
        0
      ),
    [tableProcessingOrders]
  );

  const getDisplayedQty = (menuItemId: string) =>
    (processingQtyByMenuItem.get(menuItemId) ?? 0) +
    (pendingQtyByMenuItem.get(menuItemId) ?? 0);

  const totalPhoCount =
    tableProcessingOrders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (inner, item) =>
            inner + (item.menuItem.category === PHO_SIZE_CATEGORY ? item.quantity : 0),
          0
        ),
      0
    ) +
    cart
      .filter((item) => item.menuItem.category === PHO_SIZE_CATEGORY)
      .reduce((sum, item) => sum + item.quantity, 0);

  const hasProcessingItems = tableProcessingOrders.length > 0;

  const measureCenterInScreen = (node: View | null) =>
    new Promise<{ x: number; y: number }>((resolve, reject) => {
      if (
        !node ||
        !screenRef.current ||
        typeof node.measureInWindow !== 'function' ||
        typeof screenRef.current.measureInWindow !== 'function'
      ) {
        reject(new Error('Node not measurable'));
        return;
      }

      requestAnimationFrame(() => {
        screenRef.current?.measureInWindow((screenX, screenY) => {
          node.measureInWindow((x, y, w, h) => {
            resolve({
              x: x - screenX + w / 2,
              y: y - screenY + h / 2,
            });
          });
        });
      });
    });

  const pulseCartButton = () => {
    cartPulse.stopAnimation();
    cartPulse.setValue(1);
    Animated.sequence([
      Animated.timing(cartPulse, {
        toValue: 1.12,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(cartPulse, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateIntoCart = async (sourceNode: View | null) => {
    try {
      const [start, end] = await Promise.all([
        measureCenterInScreen(sourceNode),
        measureCenterInScreen(cartIconRef.current ?? cartAnchorRef.current),
      ]);

      setFlyItem({
        startX: start.x - FLY_CHIP_SIZE / 2,
        startY: start.y - FLY_CHIP_SIZE / 2,
        endX: end.x - FLY_CHIP_SIZE / 2,
        endY: end.y - FLY_CHIP_SIZE / 2,
      });
      flyProgress.setValue(0);
      Animated.timing(flyProgress, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setFlyItem(null);
        pulseCartButton();
      });
    } catch {
      pulseCartButton();
    }
  };

  const handleAddItem = (item: MenuItem) => {
    addToCart(item);
    void animateIntoCart(menuItemRefs.current[item.id] ?? null);
  };

  const handlePhoConfirm = (menuItem: MenuItem, meats: string[]) => {
    addToCart(menuItem, { selection: formatPhoMeatNote(meats) });
    void animateIntoCart(phoAnchorRef.current);
  };

  const handleIncreasePending = (item: CartItem) => {
    addToCart(item.menuItem, { note: item.note, selection: item.selection });
  };

  const handleDecreasePending = (item: CartItem) => {
    updateQuantity(item.lineKey, item.quantity - 1);
  };

  const handleSubmitCart = async () => {
    if (cart.length === 0 || selectedTable === null) return;

    playOrderAnnouncement(selectedTable, 'gesture');
    const order = await submitOrder();
    if (!order) return;

    playOrderAnnouncement(selectedTable, 'success');
    await useOrderManageStore.getState().fetchAll();
    Alert.alert(
      'Thành công',
      hasProcessingItems
        ? `Đã gửi món mới cho ${getTableDisplayLabel(selectedTable)}!`
        : `Đơn ${order.orderNumber} - ${getTableDisplayLabel(selectedTable)} đã được gửi!`
    );
  };

  const flyTranslateX = flyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, flyItem ? flyItem.endX - flyItem.startX : 0],
  });

  const flyTranslateY = flyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, flyItem ? flyItem.endY - flyItem.startY : 0],
  });

  const flyScale = flyProgress.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 0.88, 0.2],
  });

  const flyOpacity = flyProgress.interpolate({
    inputRange: [0, 0.9, 1],
    outputRange: [1, 0.95, 0],
  });

  return (
    <View ref={screenRef} style={styles.container}>
      <View style={styles.tableBanner}>
        {selectedTable === COUNTER_TABLE_NUMBER ? (
          <CounterIcon size={22} />
        ) : (
          <TableIcon size={22} />
        )}
        <Text style={styles.tableBannerText}>
          {selectedTable === null ? 'Chưa chọn bàn' : getTableDisplayLabel(selectedTable)}
        </Text>
      </View>

      <SectionList
        sections={sections}
        key={numColumns}
        keyExtractor={(row, index) =>
          row.type === 'pho' ? 'pho-entry' : row.items.map((item) => item.id).join('-') + index
        }
        style={styles.list}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={isTablet}
        showsVerticalScrollIndicator
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, !isTablet && styles.sectionHeaderCompact]}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderSectionFooter={({ section }) => {
          const isLast = sections[sections.length - 1]?.category === section.category;
          if (isLast) return null;
          return <View style={[styles.sectionSeparator, { height: sectionGap }]} />;
        }}
        renderItem={({ item: row, section }) => {
          if (row.type === 'pho') {
            return (
              <View ref={phoAnchorRef} style={styles.phoSection}>
                <Text style={styles.phoMeatsLabel}>
                  Thịt:{' '}
                  {phoToppingItems.length > 0
                    ? formatPhoMeatSummary(phoToppingItems)
                    : 'Chưa có loại thịt đang bán'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.phoOrderBtn,
                    totalPhoCount > 0 && styles.phoOrderBtnActive,
                    phoSizeItems.length === 0 && styles.phoOrderBtnDisabled,
                  ]}
                  onPress={() => phoSizeItems.length > 0 && setPhoModalVisible(true)}
                  activeOpacity={0.75}
                  disabled={phoSizeItems.length === 0}
                >
                  <Text style={styles.phoOrderTitle}>Chọn tô phở</Text>
                  <Text style={styles.phoOrderSub}>
                    {phoSizeItems.length > 0
                      ? formatPhoSizeSummary(phoSizeItems)
                      : 'Chưa có loại tô đang bán'}
                  </Text>
                  {totalPhoCount > 0 ? (
                    <View style={styles.phoQtyBadge}>
                      <Text style={styles.phoQtyText}>x{totalPhoCount}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View style={[styles.gridRow, { paddingTop: isTablet ? 8 : 4 }]}>
              {row.items.map((item) => (
                <View
                  key={item.id}
                  ref={(node) => {
                    menuItemRefs.current[item.id] = node;
                  }}
                  style={styles.gridCell}
                >
                  <MenuItemButton
                    item={item}
                    quantity={getDisplayedQty(item.id)}
                    onPress={() => handleAddItem(item)}
                  />
                </View>
              ))}
              {row.items.length < numColumns
                ? Array.from({ length: numColumns - row.items.length }).map((_, index) => (
                    <View key={`spacer-${section.category}-${index}`} style={styles.gridCell} />
                  ))
                : null}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>Đang tải thực đơn...</Text>}
      />

      <View ref={cartAnchorRef} style={styles.floatingCartWrap}>
        <Animated.View style={{ transform: [{ scale: cartPulse }] }}>
          <TouchableOpacity style={styles.floatingCart} onPress={openCart} activeOpacity={0.85}>
            <View ref={cartIconRef} style={styles.cartIconWrap}>
              <Ionicons name="cart" size={24} color={COLORS.onAccent} />
              {pendingItemsCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{pendingItemsCount}</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {flyItem ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flyChip,
            {
              left: flyItem.startX,
              top: flyItem.startY,
              opacity: flyOpacity,
              transform: [
                { translateX: flyTranslateX },
                { translateY: flyTranslateY },
                { scale: flyScale },
              ],
            },
          ]}
        >
          <Text style={styles.flyChipText}>+1</Text>
        </Animated.View>
      ) : null}

      <PhoOrderModal
        visible={phoModalVisible}
        phoSizeItems={phoSizeItems}
        phoMeatItems={phoToppingItems}
        onClose={() => setPhoModalVisible(false)}
        onConfirm={handlePhoConfirm}
      />

      <PosCartModal
        visible={isCartOpen}
        tableLabel={selectedTable === null ? 'Chưa chọn bàn' : getTableDisplayLabel(selectedTable)}
        processingOrders={tableProcessingOrders}
        cart={cart}
        pendingSubtotal={pendingSubtotal}
        loading={loading}
        actionLabel={hasProcessingItems ? 'Gửi thêm món' : 'Tạo đơn hàng'}
        onClose={closeCart}
        onIncrease={handleIncreasePending}
        onDecrease={handleDecreasePending}
        onRemove={removeFromCart}
        onSaveNote={updateCartItemNote}
        onSubmit={handleSubmitCart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tableBanner: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tableBannerText: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 110 },
  sectionHeader: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderCompact: {
    paddingVertical: 7,
  },
  sectionSeparator: {
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  phoSection: {
    padding: 12,
  },
  phoMeatsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  phoOrderBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  phoOrderBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selected,
  },
  phoOrderBtnDisabled: {
    opacity: 0.5,
  },
  phoOrderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  phoOrderSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  phoQtyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  phoQtyText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 40,
    fontSize: 15,
  },
  floatingCartWrap: {
    position: 'absolute',
    right: 16,
    bottom: 40,
    zIndex: 20,
  },
  floatingCart: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cartIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: COLORS.onPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  flyChip: {
    position: 'absolute',
    zIndex: 30,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  flyChipText: {
    color: COLORS.onAccent,
    fontSize: 16,
    fontWeight: '800',
  },
});
