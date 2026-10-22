'use client';

import { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import styles from './ReservationSection.module.css';

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

        <Container className="text-center position-relative">
          <p className="hero-eyebrow reveal">Pesan Meja Anda</p>
          <h1 className="sec-title reveal reveal-d1">
            Table<br /><em>Reservation</em>
          </h1>
          <ul className="loc-chips reveal reveal-d2">
            <li><i className="fa-solid fa-bolt"></i>Konfirmasi Cepat</li>
            <li><i className="fa-solid fa-ticket"></i>Gratis Reservasi</li>
          </ul>
        </Container>
      </div>

      {!user ? (
        <Container className="py-4">
          <div id="reservation-lock" className={styles.lockCard}>
          <div className="gate-icon"><i className="fa-solid fa-lock"></i></div>
          <h3>Login untuk Reservasi</h3>
          <p className="text-muted">
            Silakan masuk atau buat akun terlebih dahulu untuk melanjutkan reservasi.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="papeda"
              onClick={() => onOpenAuth('login')}
            >
              Login
            </Button>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => onOpenAuth('register')}
            >
              Register
            </button>
          </div>
          </div>
        </Container>
      ) : (
        <Container className="text-content py-4" style={{ maxWidth: '720px' }}>
          <div className="mb-4">
            <Form.Label className={styles.storeLabel}>
              <i className="fa-solid fa-store me-2"></i>Pilih Gerai Restoran
            </Form.Label>
            <div className={styles.storeCards}>
              {branches.length === 0 ? (
                <p className="text-muted small mb-0">Memuat gerai...</p>
              ) : (
                branches.map((b, i) => {
                  const aktif = selectedBranch === b.nama;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`${styles.storeCard} ${aktif ? styles.active : ''}`}
                      style={{ '--i': i } as React.CSSProperties}
                      aria-pressed={aktif}
                      onClick={() => setSelectedBranch(b.nama)}
                    >
                      <span className={styles.storePin}>
                        <i className="fa-solid fa-location-dot"></i>
                      </span>
                      <span className={styles.storeInfo}>
                        <strong>{b.nama}</strong>
                        <small>{b.alamat}</small>
                      </span>
                      <i className={`fa-solid fa-circle-check ${styles.storeCheck}`}></i>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <Form onSubmit={handleSubmit} className={styles.resForm}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Full Name</Form.Label>
              <Form.Control
                type="text"
                id="res-name"
                maxLength={32}
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Email</Form.Label>
              <Form.Control
                type="email"
                id="res-email"
                maxLength={64}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Active Phone Number</Form.Label>
              <Form.Control
                type="tel"
                id="res-phone"
                placeholder="08xxxxxxxxxx"
                pattern="^08[0-9]{8,11}$"
                title="Nomor telepon harus diawali 08 dan memiliki panjang 10-13 digit angka"
                required
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col xs={7}>
                <Form.Group>
                  <Form.Label className="fw-bold">Reservation Date</Form.Label>
                  <Form.Control
                    type="date"
                    id="res-date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={5}>
                <Form.Group>
                  <Form.Label className="fw-bold">Guests</Form.Label>
                  <Form.Control
                    type="number"
                    id="res-guest"
                    min="1"
                    max="20"
                    required
                    value={jumlah}
                    onChange={(e) => setJumlah(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col xs={7}>
                <Form.Group>
                  <Form.Label className="fw-bold">Session</Form.Label>
                  <Form.Select
                    id="res-session"
                    value={sesi}
                    onChange={(e) => setSesi(e.target.value)}
                  >
                    <option value="morning">Morning (08.00 - 11.00)</option>
                    <option value="afternoon">Afternoon (12.00 - 18.00)</option>
                    <option value="night">Evening (18.00 - 21.00)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={5}>
                <Form.Group>
                  <Form.Label className="fw-bold">Arrival Time</Form.Label>
                  <Form.Control
                    type="time"
                    id="res-time"
                    required
                    value={jam}
                    onChange={(e) => setJam(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Select The Room</Form.Label>
              <Form.Select
                id="res-room"
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
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Extra Note</Form.Label>
              <Form.Control
                as="textarea"
                id="res-notes"
                rows={4}
                placeholder=". . ."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </Form.Group>

            {errorMsg && (
              <div className={styles.errorBox} role="alert">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              variant="papeda"
              className={`${styles.submitBtn} w-100 text-white fw-bold`}
            >
              {submitting ? 'Memproses Reservasi...' : 'Confirm'}
            </Button>
          </Form>
        </Container>
      )}
    </section>
  );
}