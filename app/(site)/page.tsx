'use client';

import Hero from '@/components/User/Hero/Hero';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function HomePage() {
  const { kontenWeb } = useSite();
  useReveal([kontenWeb]);
  return <Hero teksHero={kontenWeb?.teks_hero} />;
}
