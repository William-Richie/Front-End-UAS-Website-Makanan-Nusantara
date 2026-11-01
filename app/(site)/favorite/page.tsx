'use client';

import OrbitCarousel from '@/components/User/Orbit/OrbitCarousel';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function FavoritePage() {
  const { favorites } = useSite();
  useReveal([favorites]);
  return <OrbitCarousel favorites={favorites} />;
}
