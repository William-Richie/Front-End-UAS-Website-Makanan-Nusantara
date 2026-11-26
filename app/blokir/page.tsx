'use client';

import { useEffect, useState } from 'react';
import styles from './blokir.module.css';

interface Kontak {
  link_wa?: string | null;
  email?: string | null;
}

export default function BlokirPage() {
  const [kontak, setKontak] = useState<Kontak | null>(null);
  const [keluar, setKeluar] = useState(false);

  useEffect(() => {
    fetch('/api/footer')
      .then((r) => r.json())
      .then((d) => setKontak(d.data ?? null))
      .catch(() => {});
  }, []);

  const handleKeluar = async () => {
    setKeluar(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem('papeda_user');
    } catch {}
    window.location.replace('/');
  };

  const wa = kontak?.link_wa?.trim();
  const email = kontak?.email?.trim();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <i className="fa-solid fa-user-lock"></i>
        </div>

        <h1 className={styles.title}>Akun Anda Diblokir</h1>
        <p className={styles.text}>
          Akses akun ini dinonaktifkan oleh admin Papeda Restaurant, sehingga reservasi dan
          pesanan belum bisa digunakan.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => window.location.replace('/')}>
            Coba Lagi
          </button>
          <button type="button" className={styles.btnOutline} onClick={handleKeluar} disabled={keluar}>
            {keluar ? 'Keluar...' : 'Keluar'}
          </button>
        </div>

        {(wa || email) && (
          <p className={styles.contact}>
            Merasa ini keliru? Hubungi kami lewat{' '}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            )}
            {wa && email && ' atau '}
            {email && <a href={`mailto:${email}`}>Email</a>}.
          </p>
        )}
      </section>
    </main>
  );
}