'use client';

import MyReservationSection from '@/components/User/MyReservation/MyReservationSection';
import { useSite } from '@/components/User/Site/SiteContext';
import { useReveal } from '@/hooks/useReveal';

export default function MyReservationPage() {
  const { user, userReady, openAuth, showToast } = useSite();
  useReveal([user, userReady]);

  if (!userReady) return null;

  if (!user) {
    return (
      <section className="page-section">
        <div className="content-container container py-5 text-center" style={{ maxWidth: '600px' }}>
          <div className="mb-3 fs-1">
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 className="section-title mb-2">Login Dulu Ya</h2>
          <p className="text-muted mb-4">
            Silakan login untuk melihat riwayat reservasi Anda.
          </p>
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4"
            onClick={() => openAuth('login')}
          >
            Sign in
          </button>
        </div>
      </section>
    );
  }

  return <MyReservationSection user={user} onNotification={showToast} />;
}
