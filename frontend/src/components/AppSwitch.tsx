import { Switch, SwitchProps } from 'react-native';

/** Toggle hệ thống — iOS UISwitch / Android Material Switch (fallback cho TypeScript) */
export default function AppSwitch(props: SwitchProps) {
  return <Switch {...props} />;
}

export type { SwitchProps as AppSwitchProps };
