'use client';

import { useState, useEffect } from 'react';
import styles from './MyReservationSection.module.css';

export interface ReservationData {
  id: string;
  gerai: string;
  nama: string;
  tanggal: string;
  jam: string;
  sesi: string;
  jumlah: number;
  ruangan: string;
  catatan?: string | null;
  status: string;
}

interface MyReservationSectionProps {
  user: { id?: string; nama: string; email: string } | null;
  onNotification?: (msg: string) => void;
}

export default function MyReservationSection({
  user,
  onNotification,
}: MyReservationSectionProps) {
  const [list, setList] = useState<ReservationData[]>([]);
  const [loading, setLoading] = useState(false);

  const STATUS_MAP: Record<string, [string, string, string]> = {
    pending: ['Menunggu', 'pending', 'fa-hourglass-half'],
    approved: ['Dikonfirmasi', 'confirmed', 'fa-circle-check'],
    dikonfirmasi: ['Dikonfirmasi', 'confirmed', 'fa-circle-check'],
    complete: ['Selesai', 'done', 'fa-circle-check'],
    selesai: ['Selesai', 'done', 'fa-circle-check'],
    dibatalkan: ['Dibatalkan', 'cancelled', 'fa-circle-xmark'],
    cancelled: ['Dibatalkan', 'cancelled', 'fa-circle-xmark'],
  };

  const fetchReservasi = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reservasi?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setList(data.data || []);
    } catch (err) {
      console.error('Gagal mengambil reservasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setList([]), 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(true);
    }, 0);

    fetch(`/api/reservasi?email=${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setList(data.data || []);
      })
      .catch((err) => {
        if (isMounted) console.error('Gagal mengambil reservasi:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user]);

  const handleCancel = async (id: string) => {
    if (!confirm('Batalkan reservasi ini?')) return;
    try {
      const res = await fetch(`/api/reservasi/${id}/batal`, {
        method: 'PUT',
      });
      if (res.ok) {
        onNotification?.('Reservasi dibatalkan.');
        fetchReservasi();
      }
    } catch (err) {
      console.error('Gagal membatalkan reservasi:', err);
    }
  };

  if (!user) return null;

  return (
    <section id="my-reservation" className="page-section">
      <div className="hero-banner sec-hero">
        <div className="sec-hero-bg" aria-hidden="true">
          <span className="sec-rings"></span>
          <span className="sec-float f1"><i className="fa-solid fa-leaf"></i></span>
          <span className="sec-float f2"><i className="fa-solid fa-calendar-check"></i></span>
          <span className="sec-float f3"><i className="fa-solid fa-utensils"></i></span>
        </div>
        <span className="sec-q s1" aria-hidden="true"><i className="fa-solid fa-calendar-check"></i></span>
        <span className="sec-q s2" aria-hidden="true"><i className="fa-solid fa-hourglass-half"></i></span>
        <span className="sec-q s3" aria-hidden="true"><i className="fa-solid fa-bell-concierge"></i></span>
        <span className="sec-q s4" aria-hidden="true"><i className="fa-solid fa-utensils"></i></span>

        <div className="container text-center position-relative">
          <p className="hero-eyebrow reveal">Riwayat Anda</p>
          <h1 className="sec-title reveal reveal-d1">
            My<br /><em>Reservation</em>
          </h1>
          <ul className="loc-chips reveal reveal-d2">
            <li><i className="fa-solid fa-hourglass-half"></i>Pantau Status</li>
            <li><i className="fa-solid fa-rotate-left"></i>Bisa Dibatalkan</li>
          </ul>
        </div>
      </div>

      <div className="content-container container py-4" style={{ maxWidth: '850px' }}>
        {loading ? (
          <p className="text-center py-4">Memuat reservasi...</p>
        ) : list.length === 0 ? (
          <div className="text-center py-4">
            <div className={`${styles.emptyIcon} mb-2`}>
              <i className="fa-solid fa-calendar-xmark"></i>
            </div>
            <p className="text-muted">Belum ada reservasi. Yuk buat yang pertama!</p>
          </div>
        ) : (
          <div className="row g-3">
            {list.map((r) => {
              const s = STATUS_MAP[r.status] || STATUS_MAP.pending;
              const bisaBatal =
                r.status === 'pending' || r.status === 'approved' || r.status === 'dikonfirmasi';

              return (
                <div key={r.id} className="col-md-6">
                  <div className={styles.resCard}>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <h5 className="mb-0 fw-bold">
                        <i className={`fa-solid fa-store me-2 ${styles.storeIcon}`}></i>
                        {r.gerai}
                      </h5>
                      <span className={`${styles.badge} ${styles[s[1]]}`}>
                        <i className={`fa-solid ${s[2]} me-1`}></i>
                        {s[0]}
                      </span>
                    </div>

                    <ul className={`${styles.resInfo} mb-3`}>
                      <li className="mb-1">
                        <i className="fa-solid fa-calendar-day me-2"></i>
                        {r.tanggal}
                      </li>
                      <li className="mb-1">
                        <i className="fa-solid fa-clock me-2"></i>
                        {r.jam} &middot; {r.sesi}
                      </li>
                      <li className="mb-1">
                        <i className="fa-solid fa-users me-2"></i>
                        {r.jumlah} orang
                      </li>
                      <li className="mb-1">
                        <i className="fa-solid fa-chair me-2"></i>
                        {r.ruangan}
                      </li>
                      {r.catatan && (
                        <li className="mt-2 text-dark fst-italic">
                          <i className="fa-solid fa-note-sticky me-2"></i>
                          &ldquo;{r.catatan}&rdquo;
                        </li>
                      )}
                    </ul>

                    {bisaBatal && (
                      <button
                        type="button"
                        className={`btn btn-sm w-100 ${styles.cancelBtn}`}
                        onClick={() => handleCancel(r.id)}
                      >
                        Batalkan Reservasi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
