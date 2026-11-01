'use client';

import LocationSection from '@/components/User/Location/LocationSection';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function LocationPage() {
  const { branches } = useSite();
  useReveal([branches]);
  return <LocationSection branches={branches} />;
}
