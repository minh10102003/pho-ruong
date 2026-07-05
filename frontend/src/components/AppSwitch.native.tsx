import { Switch, SwitchProps } from 'react-native';

/** Toggle hệ thống — iOS UISwitch / Android Material Switch */
export default function AppSwitch(props: SwitchProps) {
  return <Switch {...props} />;
}
