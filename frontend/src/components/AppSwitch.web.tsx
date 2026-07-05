import { SwitchProps, View } from 'react-native';

/** Toggle gần native trên Safari/Chrome — dùng `<input role="switch">` thay RN Web Switch */
export default function AppSwitch({ value, onValueChange, disabled }: SwitchProps) {
  return (
    <View style={styles.wrap}>
      <input
        type="checkbox"
        role="switch"
        checked={!!value}
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.checked)}
        style={{
          width: 51,
          height: 31,
          margin: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </View>
  );
}

const styles = {
  wrap: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
