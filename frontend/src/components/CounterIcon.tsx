import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

const KITCHEN_GIF = require('../../assets/images/kitchen.gif');
const KITCHEN_STATIC = require('../../assets/images/kitchen-static.png');

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
  /** true = GIF chạy lửa; false = khung tĩnh */
  animated?: boolean;
};

export function CounterIcon({ size = 24, style, animated = false }: Props) {
  return (
    <Image
      source={animated ? KITCHEN_GIF : KITCHEN_STATIC}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
