'use client';

import About from '@/components/User/About/About';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function AboutPage() {
  const { kontenWeb } = useSite();
  useReveal([kontenWeb]);
  return <About teksAbout={kontenWeb?.teks_about} />;
}
