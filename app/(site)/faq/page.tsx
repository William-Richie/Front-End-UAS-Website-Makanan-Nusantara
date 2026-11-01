'use client';

import FaqSection from '@/components/User/Faq/FaqSection';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function FaqPage() {
  const { faqs, showToast } = useSite();
  useReveal([faqs]);
  return <FaqSection faqList={faqs} onSuccessNotification={showToast} />;
}
