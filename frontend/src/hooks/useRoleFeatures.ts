import { useAuthStore } from '../store/authStore';
import { hasRoleFeature } from '../constants/roleFeatures';

export function useRoleFeatures() {
  const features = useAuthStore((s) => s.user?.features);

  return {
    features,
    hasFeature: (key: string) => hasRoleFeature(features, key),
  };
}
