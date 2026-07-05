import { Switch, SwitchProps } from 'react-native';

/** Toggle mặc định theo nền tảng — không override màu custom */
export default function AppSwitch(props: SwitchProps) {
  return <Switch {...props} />;
}

export type { SwitchProps as AppSwitchProps };
