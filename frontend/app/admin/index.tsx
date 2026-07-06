import { Redirect } from 'expo-router';
import { useAuthStore, getRoleHomePath } from '../../src/store/authStore';

export default function AdminIndex() {
  const features = useAuthStore((s) => s.user?.features);
  return <Redirect href={getRoleHomePath('ADMIN', features)} />;
}
