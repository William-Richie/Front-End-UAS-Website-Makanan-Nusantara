'use client';

import ReservationSection from '@/components/User/Reservation/ReservationSection';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function ReservationPage() {
  const { branches, user, openAuth, showToast } = useSite();
  useReveal([branches, user]);
  return (
    <ReservationSection
      branches={branches}
      user={user}
      onOpenAuth={openAuth}
      onSuccess={showToast}
    />
  );
}
