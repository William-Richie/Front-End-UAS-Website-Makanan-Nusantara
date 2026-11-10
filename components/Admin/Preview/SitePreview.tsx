'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Hero from '@/components/User/Hero/Hero';
import About from '@/components/User/About/About';
import FaqSection, { type FaqItem } from '@/components/User/Faq/FaqSection';
import LocationSection from '@/components/User/Location/LocationSection';
import Footer from '@/components/User/Footer/Footer';
import OrbitCarousel, { type FavoriteItem } from '@/components/User/Orbit/OrbitCarousel';
import type { BranchMap } from '@/components/User/Reservation/ReservationSection';
import type { OrbitSetting } from '@/lib/orbit';

function Frame({ lebar, children }: { lebar: number; children: ReactNode }) {
  const wadah = useRef<HTMLDivElement>(null);
  const [skala, setSkala] = useState(0.5);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const ukur = () => setSkala(Math.min(1, el.clientWidth / lebar));
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lebar]);

  return (
    <div className="site-preview" ref={wadah}>
      <div className="site-preview-inner" style={{ width: lebar, zoom: skala }}>
        {children}
      </div>
    </div>
  );
}

type FooterData = React.ComponentProps<typeof Footer>['data'];

export function HalamanPreview({
  teksHero,
  teksAbout,
  faqList,
  branches,
  footer,
}: {
  teksHero?: string | null;
  teksAbout?: string | null;
  faqList: FaqItem[];
  branches: BranchMap[];
  footer: FooterData;
}) {
  return (
    <Frame lebar={1280}>
      <Hero teksHero={teksHero} />
      <About teksAbout={teksAbout} />
      <FaqSection faqList={faqList} />
      <LocationSection key={branches.map((b) => b.id).join('-')} branches={branches} />
      <Footer data={footer} />
    </Frame>
  );
}

export function OrbitPreview({ favorites, setting }: { favorites: FavoriteItem[]; setting: OrbitSetting }) {
  return (
    <Frame lebar={900}>
      <OrbitCarousel favorites={favorites} setting={setting} />
    </Frame>
  );
}
