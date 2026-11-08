'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Hero from '@/components/User/Hero/Hero';
import About from '@/components/User/About/About';
import Footer from '@/components/User/Footer/Footer';

// Preview memakai komponen yang sama persis dengan halaman user,
// dirender selebar layar desktop lalu diperkecil mengikuti lebar kartu.
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

export function KontenPreview({ teksHero, teksAbout }: { teksHero?: string | null; teksAbout?: string | null }) {
  return (
    <Frame lebar={1280}>
      <Hero teksHero={teksHero} />
      <About teksAbout={teksAbout} />
    </Frame>
  );
}

export function FooterPreview({ data }: { data: React.ComponentProps<typeof Footer>['data'] }) {
  return (
    <Frame lebar={1000}>
      <Footer data={data} />
    </Frame>
  );
}