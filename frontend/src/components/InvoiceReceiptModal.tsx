import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, PaymentConfig } from '../types';
import { PAYMENT_METHOD_LABELS } from '../constants';
import { getUploadUrl } from '../constants/images';
import { formatOrderTableLabel } from '../constants/tables';
import {
  formatReceiptAmount,
  formatReceiptDate,
  formatReceiptTime,
} from '../utils/format';
import { getOrderItemDisplayName } from '../utils/orderItemMeta';
import { numberToVietnameseWords } from '../utils/numberToWords';
import { api } from '../services/api';
import { BigButton } from './BigButton';

const DASH = '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -';
const DEFAULT_SHOP_ADDRESS = '116/2 Thành Thái, P.12, Q.10, TP. Hồ Chí Minh';

function getOrderTotal(order: Order) {
  return order.items.reduce((sum, i) => sum + Number(i.lineTotal), 0);
}

function getTotalQty(order: Order) {
  return order.items.reduce((sum, i) => sum + i.quantity, 0);
}

function getItemName(item: Order['items'][number]) {
  const baseName = getOrderItemDisplayName(item.menuItem.name, item.selection);
  return item.note ? `${baseName} - ${item.note}` : baseName;
}

interface Props {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
}

export function InvoiceReceiptModal({ order, visible, onClose }: Props) {
  const [shop, setShop] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    if (!visible) {
      setShop(null);
      return;
    }

    let cancelled = false;
    api
      .getPaymentConfig()
      .then((config) => {
        if (!cancelled) setShop(config);
      })
      .catch(() => {
        if (!cancelled) setShop(null);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!order) return null;

  const paidAt = order.paidAt ?? order.createdAt;
  const total = getOrderTotal(order);
  const totalQty = getTotalQty(order);
  const paymentLabel = order.paymentMethod
    ? PAYMENT_METHOD_LABELS[order.paymentMethod].toUpperCase()
    : 'THANH TOÁN';
  const logoUri = getUploadUrl(shop?.logoUrl);
  const invoiceNo = order.invoiceNumber ?? order.orderNumber.replace(/^PHO-/, '').slice(-4);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={26} color="#333" />
          </TouchableOpacity>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.receipt}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
              ) : null}

              <Text style={styles.shopLine}>
                {shop?.shopAddress ?? DEFAULT_SHOP_ADDRESS}
              </Text>

              <Text style={styles.dash}>{DASH}</Text>
              <Text style={styles.receiptTitle}>HÓA ĐƠN THANH TOÁN</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>Số HĐ: {invoiceNo}</Text>
              </View>
              <View style={styles.metaSplitRow}>
                <Text style={styles.metaText}>Ngày in: {formatReceiptDate(paidAt)}</Text>
                <Text style={styles.metaText}>Giờ in: {formatReceiptTime(paidAt)}</Text>
              </View>
              <Text style={styles.tableLine}>
                Bàn: <Text style={styles.tableBold}>{formatOrderTableLabel(order.tableNumber)}</Text>
              </Text>
              <Text style={styles.metaText}>Thu ngân: ADMIN</Text>
              <Text style={styles.metaText}>Khách hàng:</Text>

              <Text style={styles.dash}>{DASH}</Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.colName, styles.headerText]}>TÊN HÀNG</Text>
                <Text style={[styles.colQty, styles.headerText]}>SL</Text>
                <Text style={[styles.colPrice, styles.headerText]}>Đơn Giá</Text>
                <Text style={[styles.colTotal, styles.headerText]}>T.TIỀN</Text>
              </View>
              <Text style={styles.dashThin}>{DASH}</Text>

              {order.items.map((item, index) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.colName} numberOfLines={3}>
                    {index + 1}) {getItemName(item)}
                  </Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{formatReceiptAmount(item.unitPrice)}</Text>
                  <Text style={styles.colTotal}>{formatReceiptAmount(item.lineTotal)}</Text>
                </View>
              ))}

              <Text style={styles.dash}>{DASH}</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>T.Cộng</Text>
                <Text style={styles.summaryQty}>{totalQty}</Text>
                <Text style={styles.summaryTotal}>{formatReceiptAmount(total)}</Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{paymentLabel}</Text>
                <Text style={styles.paymentAmount}>{formatReceiptAmount(total)}</Text>
              </View>
              <Text style={styles.amountWords}>*{numberToVietnameseWords(total)}./</Text>

              <View style={styles.footerLine} />
              <Text style={styles.footerText}>Cám Ơn Quý Khách - Hẹn Gặp Lại</Text>
            </View>
          </ScrollView>

          <BigButton title="Đóng" onPress={onClose} style={styles.closeAction} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
  },
  scroll: { maxHeight: '100%' },
  scrollContent: { padding: 16, paddingTop: 40, paddingBottom: 8 },
  receipt: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  logo: {
    width: 120,
    height: 48,
    alignSelf: 'center',
    marginBottom: 8,
  },
  shopLine: {
    fontSize: 12,
    textAlign: 'center',
    color: '#222',
    marginTop: 4,
    lineHeight: 16,
  },
  dash: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    marginVertical: 8,
    letterSpacing: -0.5,
  },
  dashThin: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
    marginBottom: 8,
  },
  metaRow: { marginBottom: 2 },
  metaSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#222',
    lineHeight: 18,
  },
  tableLine: {
    fontSize: 13,
    color: '#222',
    marginTop: 2,
    marginBottom: 2,
  },
  tableBold: {
    fontWeight: '800',
    fontSize: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  headerText: {
    fontWeight: '700',
    fontSize: 11,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  colName: {
    flex: 1.6,
    fontSize: 12,
    color: '#111',
    paddingRight: 4,
  },
  colQty: {
    width: 28,
    fontSize: 12,
    textAlign: 'center',
    color: '#111',
  },
  colPrice: {
    width: 58,
    fontSize: 12,
    textAlign: 'right',
    color: '#111',
  },
  colTotal: {
    width: 62,
    fontSize: 12,
    textAlign: 'right',
    color: '#111',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    flex: 1.6,
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  summaryQty: {
    width: 28,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  summaryTotal: {
    width: 120,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    color: '#111',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 16,
  },
  paymentLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    flexShrink: 1,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    textAlign: 'right',
    minWidth: 100,
  },
  amountWords: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#222',
    lineHeight: 18,
    marginBottom: 10,
  },
  footerLine: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111',
    marginBottom: 4,
  },
  closeAction: {
    margin: 12,
    minHeight: 48,
  },
});
