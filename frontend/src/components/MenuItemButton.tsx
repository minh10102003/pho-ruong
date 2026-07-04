import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { MenuItem } from '../types';
import { COLORS } from '../constants';
import { getMenuImageUrl } from '../constants/images';
import { formatCurrency } from '../utils/format';

interface Props {
  item: MenuItem;
  onPress: () => void;
  onRemove?: () => void;
  quantity?: number;
}

// Ô vuông món ăn trong lưới POS
export const MenuItemButton: React.FC<Props> = ({
  item,
  onPress,
  onRemove,
  quantity = 0,
}) => {
  const imageUri = getMenuImageUrl(item.imageUrl);

  return (
    <TouchableOpacity
      style={[styles.card, quantity > 0 && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {imageUri ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>
      ) : (
        <View style={styles.imageSpacer} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>
      {quantity > 0 && (
        <>
          {onRemove ? (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Text style={styles.removeBtnText}>×</Text>
            </TouchableOpacity>
          ) : null}
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>x{quantity}</Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  selected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selected,
  },
  imageWrap: {
    flex: 1,
    width: '100%',
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSpacer: {
    flex: 1,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
    textAlign: 'center',
  },
  qtyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.primary,
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 2,
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.error,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  removeBtnText: {
    color: COLORS.onPrimary,
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 24,
    marginTop: -1,
  },
  qtyText: {
    color: COLORS.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
