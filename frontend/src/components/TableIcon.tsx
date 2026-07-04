import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const TABLE_ICON = require('../../assets/images/table-icon.png');

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function TableIcon({ size = 24, style }: Props) {
  return (
    <Image
      source={TABLE_ICON}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
