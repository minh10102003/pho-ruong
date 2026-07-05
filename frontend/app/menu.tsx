import { Redirect } from 'expo-router';
import { useAuthStore, getRoleHomePath } from '../src/store/authStore';
import { getPosMenuPath } from '../src/utils/posRoutes';

/** Chuyển hướng /menu (URL cũ) về đúng màn POS theo vai trò */
export default function LegacyMenuRedirect() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === 'ADMIN') {
    return <Redirect href={getRoleHomePath(user.role)} />;
  }

  return <Redirect href={getPosMenuPath(user.role)} />;
}
