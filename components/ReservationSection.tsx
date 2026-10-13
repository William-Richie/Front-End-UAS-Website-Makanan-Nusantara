'use client';

import { useState } from 'react';

export interface BranchMap {
  id: number;
  nama: string;
  alamat: string;
  latitude: number;
  longitude: number;
}

interface ReservationSectionProps {
  branches: BranchMap[];
  user: { id?: string; nama: string; email: string } | null;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onSuccess: (msg: string) => void;
}

export default function ReservationSection({
  branches,
  user,
  onOpenAuth,
  onSuccess,
}: ReservationSectionProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [nama, setNama] = useState(user?.nama || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telepon, setTelepon] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [jumlah, setJumlah] = useState<number>(2);
  const [sesi, setSesi] = useState('morning');
  const [jam, setJam] = useState('');
  const [ruangan, setRuangan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (!selectedBranch) {
      setErrorMsg('Silakan pilih gerai restoran.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/reservasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id || null,
          gerai: selectedBranch,
          nama: nama.trim(),
          email: email.trim(),
          telepon: telepon.trim(),
          tanggal,
          jam,
          sesi,
          jumlah: Number(jumlah),
          ruangan,
          catatan: catatan.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal menyimpan reservasi');
      }

      onSuccess('Reservasi berhasil dikonfirmasi! Silakan cek menu My Reservation.');
      setTelepon('');
      setTanggal('');
      setJam('');
      setCatatan('');
      setRuangan('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses reservasi.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reservation" className="page-section">
      <div className="hero-banner sec-hero">
        <div className="sec-hero-bg" aria-hidden="true">
          <span className="sec-rings"></span>
          <span className="sec-float f1"><i className="fa-solid fa-leaf"></i></span>
          <span className="sec-float f2"><i className="fa-solid fa-clock"></i></span>
          <span className="sec-float f3"><i className="fa-solid fa-users"></i></span>
        </div>
        <span className="sec-q s1" aria-hidden="true"><i className="fa-solid fa-calendar-check"></i></span>
        <span className="sec-q s2" aria-hidden="true"><i className="fa-solid fa-clock"></i></span>
        <span className="sec-q s3" aria-hidden="true"><i className="fa-solid fa-bell-concierge"></i></span>
        <span className="sec-q s4" aria-hidden="true"><i className="fa-solid fa-users"></i></span>

        <div className="container text-center position-relative section-content-wrap">
          <p className="hero-eyebrow reveal">Pesan Meja Anda</p>
          <h1 className="sec-title reveal reveal-d1">
            Table<br /><em>Reservation</em>
          </h1>
          <ul className="loc-chips reveal reveal-d2">
            <li><i className="fa-solid fa-bolt"></i>Konfirmasi Cepat</li>
            <li><i className="fa-solid fa-ticket"></i>Gratis Reservasi</li>
          </ul>
        </div>
      </div>

      {!user ? (
        <div id="reservation-lock" className="auth-lock text-center py-5">
          <div className="gate-icon mb-3"><i className="fa-solid fa-lock fs-2 text-warning"></i></div>
          <h3>Login untuk Reservasi</h3>
          <p className="text-muted">
            Silakan masuk atau buat akun terlebih dahulu untuk melanjutkan reservasi.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-papeda"
              onClick={() => onOpenAuth('login')}
            >
              Login
            </button>
            <button
              type="button"
              className="btn btn-papeda-outline"
              onClick={() => onOpenAuth('register')}
            >
              Register
            </button>
          </div>
        </div>
      ) : (
        <div className="content-containers text-content container py-4" style={{ maxWidth: '720px' }}>
          <div className="mb-4">
            <label className="form-label fw-bold store-label">
              <i className="fa-solid fa-store me-2"></i>Pilih Gerai Restoran
            </label>
            <div className="store-cards d-flex flex-wrap gap-2">
              {branches.length === 0 ? (
                <p className="text-muted small mb-0">Memuat gerai...</p>
              ) : (
                branches.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded border flex-fill ${selectedBranch === b.nama ? 'border-warning bg-light' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedBranch(b.nama)}
                  >
                    <div className="fw-bold">{b.nama}</div>
                    <small className="text-muted">{b.alamat}</small>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="reservation-form-group">
            <div className="mb-3">
              <label htmlFor="res-name" className="form-label fw-bold">Full Name</label>
              <input
                type="text"
                id="res-name"
                className="form-control"
                maxLength={32}
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="res-email" className="form-label fw-bold">Email</label>
              <input
                type="email"
                id="res-email"
                className="form-control"
                maxLength={64}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="res-phone" className="form-label fw-bold">Active Phone Number</label>
              <input
                type="tel"
                id="res-phone"
                className="form-control"
                placeholder="08xxxxxxxxxx"
                pattern="^08[0-9]{8,11}$"
                title="Nomor telepon harus diawali 08 dan memiliki panjang 10-13 digit angka"
                required
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-7">
                <label htmlFor="res-date" className="form-label fw-bold">Reservation Date</label>
                <input
                  type="date"
                  id="res-date"
                  className="form-control"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </div>
              <div className="col-5">
                <label htmlFor="res-guest" className="form-label fw-bold">Guests</label>
                <input
                  type="number"
                  id="res-guest"
                  className="form-control"
                  min="1"
                  max="20"
                  required
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-7">
                <label htmlFor="res-session" className="form-label fw-bold">Session</label>
                <select
                  id="res-session"
                  className="form-select"
                  value={sesi}
                  onChange={(e) => setSesi(e.target.value)}
                >
                  <option value="morning">Morning (08.00 - 11.00)</option>
                  <option value="afternoon">Afternoon (12.00 - 18.00)</option>
                  <option value="night">Evening (18.00 - 21.00)</option>
                </select>
              </div>
              <div className="col-5">
                <label htmlFor="res-time" className="form-label fw-bold">Arrival Time</label>
                <input
                  type="time"
                  id="res-time"
                  className="form-control"
                  required
                  value={jam}
                  onChange={(e) => setJam(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="res-room" className="form-label fw-bold">Select The Room</label>
              <select
                id="res-room"
                className="form-select"
                required
                value={ruangan}
                onChange={(e) => setRuangan(e.target.value)}
              >
                <option value="" disabled>-- Type of Room --</option>
                <optgroup label="Reguler">
                  <option value="reguler-indoor">Reguler Indoor (No Smoking / AC)</option>
                  <option value="reguler-outdoor">Reguler Outdoor (Free Smoking)</option>
                </optgroup>
                <optgroup label="VIP Room">
                  <option value="vip-10">VIP Room 1 (1 Table, Recommended for 4 - 10 people)</option>
                  <option value="vip-10-tv">VIP Room 1 ++ (1 Table + TV, Recommended for 4 - 10 people)</option>
                  <option value="vip-20">VIP Room 2 (2 Table, Recommended for 8 - 20 people)</option>
                  <option value="vip-20-tv">VIP Room 2 ++ (2 Table + TV, Recommended for 8 - 20 people)</option>
                </optgroup>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="res-notes" className="form-label fw-bold">Extra Note</label>
              <textarea
                id="res-notes"
                className="form-control"
                rows={4}
                placeholder=". . ."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>

            {errorMsg && <div className="alert alert-danger py-2">{errorMsg}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="btn submit w-100 text-white fw-bold"
            >
              {submitting ? 'Memproses Reservasi...' : 'Confirm'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
