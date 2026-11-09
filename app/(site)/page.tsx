'use client';

import Hero from '@/components/User/Hero/Hero';
import About from '@/components/User/About/About';
import FaqSection from '@/components/User/Faq/FaqSection';
import LocationSection from '@/components/User/Location/LocationSection';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function HomePage() {
  const {
    kontenWeb,
    faqs,
    branches,
    showToast,
  } = useSite();

  useReveal([kontenWeb, faqs, branches]);

  return (
    <>
      <Hero teksHero={kontenWeb?.teks_hero} />

      <About teksAbout={kontenWeb?.teks_about} />

      <FaqSection
        faqList={faqs}
        onSuccessNotification={showToast}
      />

      <LocationSection branches={branches} />
    </>
  );
}