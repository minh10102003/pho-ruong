import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { getPosMenuPath } from '../utils/posRoutes';
import { useOrderManageStore } from '../store/orderManageStore';
import { usePosStore } from '../store/posStore';
import { BigButton } from '../components/BigButton';
import { InvoiceReceiptModal } from '../components/InvoiceReceiptModal';
import {
  COUNTER_TABLE_NUMBER,
  formatOrderTableLabel,
  isCounterTable,
  ordersShareTable,
} from '../constants/tables';
import { COLORS, WS_URL, PAYMENT_METHOD_LABELS, ORDER_STATUS_LABELS } from '../constants';
import { getUploadUrl } from '../constants/images';
import { formatCurrency, formatDateTime } from '../utils/format';
import { getOrderItemDisplayName } from '../utils/orderItemMeta';
import { playCashPaymentSound, playTransferPaymentSound } from '../utils/sounds';
import { Order, OrderItem, PaymentMethod } from '../types';
import { api } from '../services/api';

const PAYMENT_BLOCKED_MESSAGE =
  'vẫn còn món chưa ra đủ. Vui lòng đánh dấu đã ra món hết trước khi thanh toán.';

function getProcessingOrdersForTable(order: Order): Order[] {
  const processingOrders = useOrderManageStore.getState().processingOrders;
  return processingOrders.filter((o) => ordersShareTable(o, order));
}

function tableHasProcessingOrders(order: Order): boolean {
  return getProcessingOrdersForTable(order).length > 0;
}

function getEditableTableNumber(tableNumber?: string): number | null {
  if (!tableNumber) return null;
  if (isCounterTable(tableNumber)) return COUNTER_TABLE_NUMBER;

  const parsed = Number(tableNumber);
  return Number.isInteger(parsed) ? parsed : null;
}

type TabKey = 'processing' | 'served' | 'history';

const PROCESSING_ORDER_BADGE = { label: 'Đang làm', color: COLORS.accent };
const SERVED_ORDER_BADGE = { label: 'Chờ thanh toán', color: COLORS.warning };

function getOrderItemsTotal(order: Order) {
  return order.items.reduce((sum, i) => sum + Number(i.lineTotal), 0);
}

function OrderItemsSummary({ order }: { order: Order }) {
  const summary = order.items
    .map((i) => {
      const label = getOrderItemDisplayName(i.menuItem.name, i.selection);
      return `${label} x${i.quantity}`;
    })
    .join(', ');
  return <Text style={styles.itemsText} numberOfLines={3}>{summary}</Text>;
}

function OrderCardHeader({
  order,
  badge,
}: {
  order: Order;
  badge: React.ReactNode;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardTitle}>
        <Text style={styles.tableTitle}>
          {formatOrderTableLabel(order.tableNumber)}
        </Text>
        <Text style={styles.orderCode}>{order.orderNumber}</Text>
      </View>
      {badge}
    </View>
  );
}

function OrderInvoiceModal({
  order,
  visible,
  editable = false,
  loading = false,
  onClose,
  onRemoveItem,
  onReplaceItem,
}: {
  order: Order | null;
  visible: boolean;
  editable?: boolean;
  loading?: boolean;
  onClose: () => void;
  onRemoveItem?: (itemId: string) => Promise<void>;
  onReplaceItem?: (item: OrderItem) => Promise<void>;
}) {
  const [confirmAction, setConfirmAction] = useState<{
    item: OrderItem;
    mode: 'delete' | 'replace';
  } | null>(null);

  useEffect(() => {
    if (!visible) {
      setConfirmAction(null);
    }
  }, [visible, order?.id]);

  if (!order) return null;

  const confirmItem = confirmAction?.item ?? null;
  const isReplaceMode = confirmAction?.mode === 'replace';

  const handleConfirmAction = async () => {
    if (!confirmItem) return;

    setConfirmAction(null);

    if (isReplaceMode) {
      await onReplaceItem?.(confirmItem);
      return;
    }

    await onRemoveItem?.(confirmItem.id);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Hóa đơn tạm tính</Text>
          <Text style={styles.modalTable}>
            {formatOrderTableLabel(order.tableNumber)}
          </Text>
          <Text style={styles.modalOrderCode}>{order.orderNumber}</Text>

          {confirmItem ? (
            <View style={styles.deleteConfirmBox}>
              <Text style={styles.deleteConfirmTitle}>
                {isReplaceMode ? 'Đổi món này?' : 'Xóa món?'}
              </Text>
              <Text style={styles.deleteConfirmText}>{confirmItem.menuItem.name}</Text>
              {confirmItem.selection ? (
                <Text style={styles.deleteConfirmSelection}>
                  Lựa chọn: {confirmItem.selection}
                </Text>
              ) : null}
              {confirmItem.note ? (
                <Text style={styles.deleteConfirmNote}>Ghi chú: {confirmItem.note}</Text>
              ) : null}
              <View style={styles.deleteConfirmActions}>
                <BigButton
                  title="Huỷ"
                  variant="secondary"
                  onPress={() => setConfirmAction(null)}
                  disabled={loading}
                  style={styles.deleteConfirmBtn}
                />
                <BigButton
                  title={isReplaceMode ? 'Xóa và chọn món mới' : 'Xóa'}
                  onPress={() => void handleConfirmAction()}
                  loading={loading}
                  style={styles.deleteConfirmBtn}
                />
              </View>
            </View>
          ) : (
            <>
              <ScrollView style={styles.modalItems} showsVerticalScrollIndicator={false}>
                {order.items.map((item) => (
                  <View key={item.id} style={styles.invoiceRow}>
                    <View style={styles.invoiceItemInfo}>
                      <Text style={styles.invoiceItemName}>{item.menuItem.name}</Text>
                      {item.selection ? (
                        <Text style={styles.invoiceItemSelection}>
                          Lựa chọn: {item.selection}
                        </Text>
                      ) : null}
                      {item.note ? (
                        <Text style={styles.invoiceItemNote}>Ghi chú: {item.note}</Text>
                      ) : null}
                      <Text style={styles.invoiceItemQty}>
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                      </Text>
                    </View>
                    <View style={styles.invoiceRowEnd}>
                      <Text style={styles.invoiceLineTotal}>
                        {formatCurrency(item.lineTotal)}
                      </Text>
                      {editable ? (
                        <View style={styles.invoiceActions}>
                          <TouchableOpacity
                            style={styles.replaceItemBtn}
                            onPress={() => setConfirmAction({ item, mode: 'replace' })}
                            disabled={loading}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="swap-horizontal-outline"
                              size={22}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteItemBtn}
                            onPress={() => setConfirmAction({ item, mode: 'delete' })}
                            disabled={loading}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.invoiceSummary}>
                <View style={[styles.invoiceSummaryRow, styles.invoiceTotalRow]}>
                  <Text style={styles.invoiceTotalLabel}>Tổng cộng</Text>
                  <Text style={styles.invoiceTotalValue}>
                    {formatCurrency(getOrderItemsTotal(order))}
                  </Text>
                </View>
              </View>

              <BigButton title="OK" onPress={onClose} style={styles.modalOkBtn} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ModalBackButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.modalBackBtn}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={26} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

function ModalCloseButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.modalCloseBtn}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
    >
      <Ionicons name="close" size={26} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
}

function PaymentConfirmModal({
  order,
  visible,
  loading,
  onClose,
  onConfirm,
}: {
  order: Order | null;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => void;
}) {
  const [step, setStep] = useState<'choose' | 'transfer'>('choose');
  const [qrLoadFailed, setQrLoadFailed] = useState(false);
  const [transferQrUrl, setTransferQrUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) {
      setStep('choose');
      setQrLoadFailed(false);
      setTransferQrUrl(undefined);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || step !== 'transfer') return;

    let cancelled = false;
    api
      .getPaymentConfig()
      .then((config) => {
        if (!cancelled) {
          setTransferQrUrl(getUploadUrl(config.transferQrUrl));
        }
      })
      .catch(() => {
        if (!cancelled) setTransferQrUrl(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, step]);

  if (!order) return null;

  const total = getOrderItemsTotal(order);
  const showQrImage = Boolean(transferQrUrl) && !qrLoadFailed;

  if (step === 'transfer') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.modalContentWithClose]}>
            <ModalBackButton
              onPress={() => setStep('choose')}
              disabled={loading}
            />
            <ModalCloseButton onPress={onClose} disabled={loading} />
            <Text style={styles.modalTitle}>Chuyển khoản</Text>
            <Text style={styles.modalTable}>
              {formatOrderTableLabel(order.tableNumber)}
            </Text>
            <Text style={styles.modalOrderCode}>{order.orderNumber}</Text>

            <Text style={styles.transferAmountLabel}>Số tiền cần chuyển</Text>
            <Text style={styles.paymentTotal}>{formatCurrency(total)}</Text>

            <View style={styles.qrWrap}>
              {showQrImage ? (
                <Image
                  source={{ uri: transferQrUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onError={() => setQrLoadFailed(true)}
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrPlaceholderText}>Mã QR</Text>
                  <Text style={styles.qrPlaceholderSub}>Ảnh sẽ được cập nhật sau</Text>
                </View>
              )}
            </View>

            <BigButton
              title="Xác nhận đã chuyển"
              onPress={() => onConfirm('TRANSFER')}
              loading={loading}
              style={styles.paymentBtn}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.modalContentWithClose]}>
          <ModalCloseButton onPress={onClose} disabled={loading} />
          <Text style={styles.modalTitle}>Xác nhận thanh toán</Text>
          <Text style={styles.modalTable}>
            {formatOrderTableLabel(order.tableNumber)}
          </Text>
          <Text style={styles.modalOrderCode}>{order.orderNumber}</Text>

          <Text style={styles.paymentTotal}>{formatCurrency(total)}</Text>
          <Text style={styles.paymentHint}>Chọn hình thức thanh toán</Text>

          <View style={styles.paymentActions}>
            <BigButton
              title="Tiền mặt"
              onPress={() => onConfirm('CASH')}
              loading={loading}
              style={styles.paymentBtn}
            />
            <BigButton
              title="Chuyển khoản"
              onPress={() => setStep('transfer')}
              disabled={loading}
              variant="secondary"
              style={styles.paymentBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PaymentBlockedModal({
  tableLabel,
  message,
  visible,
  onClose,
}: {
  tableLabel: string;
  message: string;
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Không thể thanh toán</Text>
          <Text style={styles.paymentBlockedText}>
            {tableLabel} {message}
          </Text>
          <BigButton title="OK" onPress={onClose} style={styles.modalOkBtn} />
        </View>
      </View>
    </Modal>
  );
}

// Màn hình quản lý đơn hàng
export default function OrderManageScreen() {
  const [tab, setTab] = useState<TabKey>('processing');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailEditable, setDetailEditable] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [paymentBlocked, setPaymentBlocked] = useState<{
    tableLabel: string;
    message: string;
  } | null>(null);
  const {
    processingOrders,
    servedOrders,
    paidOrders,
    loading,
    fetchAll,
    updateOrderStatus,
    removeOrderItem,
  } = useOrderManageStore();
  const { setSelectedTable, clearCart, closeCart } = usePosStore();
  const user = useAuthStore((s) => s.user);
  const canPayOrders = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [])
  );

  useEffect(() => {
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ORDER_UPDATE') {
          fetchAll();
        }
      };
    } catch {
      const interval = setInterval(fetchAll, 10000);
      return () => clearInterval(interval);
    }

    return () => ws?.close();
  }, []);

  const openDetail = (order: Order, editable = false) => {
    if (order.status === 'PAID') {
      setReceiptOrder(order);
      return;
    }
    setDetailEditable(editable);
    setDetailOrder(order);
  };
  const closeDetail = () => {
    setDetailOrder(null);
    setDetailEditable(false);
  };
  const closeReceipt = () => setReceiptOrder(null);
  const closePaymentBlocked = () => setPaymentBlocked(null);

  const showPaymentBlocked = (order: Order) => {
    setPaymentBlocked({
      tableLabel: formatOrderTableLabel(order.tableNumber),
      message: PAYMENT_BLOCKED_MESSAGE,
    });
  };

  const openPayment = async (order: Order) => {
    await fetchAll();
    if (tableHasProcessingOrders(order)) {
      showPaymentBlocked(order);
      return;
    }
    setPayOrder(order);
  };

  const closePayment = () => setPayOrder(null);

  const handleConfirmPayment = async (method: PaymentMethod) => {
    if (!payOrder) return;

    await fetchAll();
    if (tableHasProcessingOrders(payOrder)) {
      showPaymentBlocked(payOrder);
      return;
    }

    if (method === 'CASH') {
      playCashPaymentSound('gesture');
    } else {
      playTransferPaymentSound('gesture');
    }
    const paidOrder = await updateOrderStatus(payOrder.id, 'PAID', method);
    if (!paidOrder) {
      const err = useOrderManageStore.getState().error;
      setPaymentBlocked({
        tableLabel: formatOrderTableLabel(payOrder.tableNumber),
        message: err ?? 'Thanh toán thất bại',
      });
      return;
    }
    closePayment();
    if (method === 'CASH') {
      playCashPaymentSound('success');
    } else {
      playTransferPaymentSound('success');
    }
    setTab('history');
    setReceiptOrder(paidOrder);
  };

  const handleMarkServed = async (order: Order) => {
    const updated = await updateOrderStatus(order.id, 'SERVED');
    if (updated) {
      setTab('served');
    }
  };

  const handleRemoveOrderItem = async (itemId: string) => {
    if (!detailOrder) return;
    const updated = await removeOrderItem(detailOrder.id, itemId);
    if (useOrderManageStore.getState().error) return;
    if (updated === null) {
      closeDetail();
      return;
    }
    setDetailOrder(updated);
  };

  const handleReplaceOrderItem = async (item: OrderItem) => {
    if (!detailOrder) return;

    const nextTable = getEditableTableNumber(detailOrder.tableNumber);
    const updated = await removeOrderItem(detailOrder.id, item.id);
    if (useOrderManageStore.getState().error) return;

    clearCart();
    closeCart();
    closeDetail();

    if (nextTable !== null) {
      setSelectedTable(nextTable);
      router.replace(getPosMenuPath(user?.role));
      return;
    }

    if (updated) {
      setDetailOrder(updated);
    }
  };

  const renderProcessingOrder = (order: Order) => (
    <View key={order.id} style={styles.card}>
      <TouchableOpacity onPress={() => openDetail(order, true)} activeOpacity={0.7}>
        <OrderCardHeader
          order={order}
          badge={
            <View style={[styles.badge, { backgroundColor: PROCESSING_ORDER_BADGE.color }]}>
              <Text style={styles.badgeText}>
                {ORDER_STATUS_LABELS[order.status] ?? PROCESSING_ORDER_BADGE.label}
              </Text>
            </View>
          }
        />

        <OrderItemsSummary order={order} />
        <Text style={styles.timeText}>Tạo lúc: {formatDateTime(order.createdAt)}</Text>
        {order.note ? <Text style={styles.noteText}>Ghi chú: {order.note}</Text> : null}
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatCurrency(getOrderItemsTotal(order))}</Text>
        <BigButton
          title="Đã ra món"
          onPress={() => handleMarkServed(order)}
          loading={loading}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );

  const renderServedOrder = (order: Order) => (
    <View key={order.id} style={styles.card}>
      <TouchableOpacity onPress={() => openDetail(order)} activeOpacity={0.7}>
        <OrderCardHeader
          order={order}
          badge={
            <View style={[styles.badge, { backgroundColor: SERVED_ORDER_BADGE.color }]}>
              <Text style={styles.badgeText}>{SERVED_ORDER_BADGE.label}</Text>
            </View>
          }
        />

        <OrderItemsSummary order={order} />
        <Text style={styles.timeText}>Tạo lúc: {formatDateTime(order.createdAt)}</Text>
        {order.note ? <Text style={styles.noteText}>Ghi chú: {order.note}</Text> : null}
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatCurrency(getOrderItemsTotal(order))}</Text>
        {canPayOrders ? (
          <BigButton
            title="Thanh toán"
            onPress={() => openPayment(order)}
            style={styles.actionBtn}
          />
        ) : null}
      </View>
    </View>
  );

  const renderPaidOrder = (order: Order) => (
    <TouchableOpacity
      key={order.id}
      style={styles.card}
      onPress={() => openDetail(order)}
      activeOpacity={0.7}
    >
      <OrderCardHeader
        order={order}
        badge={
          <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
            <Text style={styles.badgeText}>Đã thanh toán</Text>
          </View>
        }
      />

      <OrderItemsSummary order={order} />
      <Text style={styles.timeText}>
        Thanh toán: {order.paidAt ? formatDateTime(order.paidAt) : formatDateTime(order.createdAt)}
      </Text>
      {order.paymentMethod ? (
        <Text style={styles.paymentMethodText}>
          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatCurrency(getOrderItemsTotal(order))}</Text>
      </View>
    </TouchableOpacity>
  );

  const orders =
    tab === 'processing'
      ? processingOrders
      : tab === 'served'
        ? servedOrders
        : paidOrders;

  const emptyText =
    tab === 'processing'
      ? 'Không có đơn đang xử lý'
      : tab === 'served'
        ? 'Không có đơn đã ra món'
        : 'Chưa có đơn đã thanh toán';

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'processing' && styles.tabActive]}
          onPress={() => setTab('processing')}
        >
          <Text style={[styles.tabText, tab === 'processing' && styles.tabTextActive]}>
            Đang xử lý ({processingOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'served' && styles.tabActive]}
          onPress={() => setTab('served')}
        >
          <Text style={[styles.tabText, tab === 'served' && styles.tabTextActive]}>
            Đã ra món ({servedOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            Lịch sử ({paidOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAll} colors={[COLORS.primary]} />
        }
      >
        {orders.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText}</Text>
        ) : (
          orders.map((order) => {
            if (tab === 'processing') return renderProcessingOrder(order);
            if (tab === 'served') return renderServedOrder(order);
            return renderPaidOrder(order);
          })
        )}
      </ScrollView>

      <OrderInvoiceModal
        order={detailOrder}
        visible={detailOrder !== null}
        editable={detailEditable}
        loading={loading}
        onClose={closeDetail}
        onRemoveItem={detailEditable ? handleRemoveOrderItem : undefined}
        onReplaceItem={detailEditable ? handleReplaceOrderItem : undefined}
      />

      <InvoiceReceiptModal
        order={receiptOrder}
        visible={receiptOrder !== null}
        onClose={closeReceipt}
      />

      <PaymentConfirmModal
        order={payOrder}
        visible={payOrder !== null}
        loading={loading}
        onClose={closePayment}
        onConfirm={handleConfirmPayment}
      />

      <PaymentBlockedModal
        tableLabel={paymentBlocked?.tableLabel ?? ''}
        message={paymentBlocked?.message ?? ''}
        visible={paymentBlocked !== null}
        onClose={closePaymentBlocked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  list: { padding: 16, paddingBottom: 32 },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 15,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: { flex: 1, marginRight: 8 },
  tableTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  orderCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: COLORS.onPrimary, fontSize: 12, fontWeight: '600' },
  itemsText: { fontSize: 14, color: COLORS.text, marginBottom: 6 },
  timeText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  noteText: { fontSize: 13, color: COLORS.warning, fontStyle: 'italic', marginBottom: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  total: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  actionBtn: { minHeight: 40, paddingVertical: 8, paddingHorizontal: 16, minWidth: 130 },
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
    maxHeight: '85%',
  },
  modalContentWithClose: {
    paddingTop: 44,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  modalBackBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalTable: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  modalOrderCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  modalItems: { maxHeight: 240, marginBottom: 12 },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  invoiceItemInfo: { flex: 1, marginRight: 12 },
  invoiceRowEnd: {
    alignItems: 'flex-end',
    gap: 6,
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replaceItemBtn: {
    padding: 4,
  },
  deleteItemBtn: {
    padding: 4,
  },
  deleteConfirmBox: {
    marginBottom: 16,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteConfirmText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteConfirmNote: {
    fontSize: 14,
    color: COLORS.warning,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  deleteConfirmSelection: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteConfirmBtn: {
    flex: 1,
    minHeight: 44,
  },
  invoiceItemName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  invoiceItemSelection: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 2,
  },
  invoiceItemNote: {
    fontSize: 13,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 2,
  },
  invoiceItemQty: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  invoiceLineTotal: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  modalNote: {
    fontSize: 13,
    color: COLORS.warning,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  invoiceSummary: { marginBottom: 16 },
  invoiceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  invoiceTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 6,
    paddingTop: 8,
  },
  invoiceTotalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  invoiceTotalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  modalOkBtn: { minHeight: 48 },
  paymentTotal: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  paymentBlockedText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  transferAmountLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  qrWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  qrPlaceholder: {
    width: 260,
    height: 260,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  qrPlaceholderSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  paymentActions: { gap: 10, marginBottom: 12 },
  paymentBtn: { minHeight: 52 },
  modalCancelBtn: { minHeight: 44 },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
});
