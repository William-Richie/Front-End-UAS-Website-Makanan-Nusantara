'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import styles from './ReservationSection.module.css';

// tanggal & jam hari ini menurut jam perangkat pengguna (format YYYY-MM-DD dan HH:MM)
const sekarangLokal = () => {
  const d = new Date();
  const dua = (n: number) => String(n).padStart(2, '0');

  return {
    tanggal: `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`,
    jam: `${dua(d.getHours())}:${dua(d.getMinutes())}`,
  };
};

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
  const [jumlah, setJumlah] = useState<number>(0);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [sesi, setSesi] = useState('');
  const [ruangan, setRuangan] = useState('');
  const [terisi, setTerisi] = useState<string[]>([]);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hariIni, setHariIni] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [isShaking, setIsShaking] = useState(false);
  const triggerShake = () => {
    setIsShaking(false);

    requestAnimationFrame(() => {
      setIsShaking(true);
    });

    setTimeout(() => {
      setIsShaking(false);
    }, 400);
  };

  const availableTimes = Array.from(
    { length: 27 },
    (_, i) => {
      const totalMinutes = 8 * 60 + i * 30;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => setHariIni(sekarangLokal().tanggal), 0);
    return () => clearTimeout(timer);
  }, []);

  
  useEffect(() => {
    if (!selectedBranch || !tanggal || !sesi) {
      return;
    }

    let batal = false;

    const params = new URLSearchParams({
      terisi: '1',
      gerai: selectedBranch,
      tanggal,
      sesi,
    });

    fetch(`/api/reservasi?${params}`)
      .then((r) => r.json())
      .then((d) => {
      if (batal) return;

        const daftar: string[] = d.terisi ?? [];
        setTerisi(daftar);
        setRuangan((cur) =>
          daftar.includes(cur) ? '' : cur
        );
      })
    .catch(() => {});

    return () => {
      batal = true;
    };
  }, [selectedBranch, tanggal, sesi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      triggerShake();
      return;
    }
    if (!selectedBranch) {
      setErrorMsg('Silakan pilih outlet terlebih dahulu!');
      triggerShake();
      return;
    }
    if (!nama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi!');
      triggerShake();
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email wajib diisi!');
      triggerShake();
      return;
    }
    if (!/^08[0-9]{8,11}$/.test(telepon.trim())) {
      setErrorMsg('Nomor telepon harus diawali 08 dan berisi 10-13 digit angka!');
      triggerShake();
      return;
    }
    if (!tanggal) {
      setErrorMsg('Tanggal reservasi wajib diisi!');
      triggerShake();
      return;
    }
    if (!sesi) {
      setErrorMsg('Silakan pilih jam reservasi terlebih dahulu!');
      triggerShake();
      return;
    }
    if (jumlah < 1 || jumlah > 20) {
      setErrorMsg('Silakan pilih jumlah tamu terlebih dahulu!');
      triggerShake();
      return;
    }
    if (!ruangan) {
      setErrorMsg('Silakan pilih tipe ruangan!');
      triggerShake();
      return;
    }
    const now = sekarangLokal();
    if (tanggal < now.tanggal) {
      setErrorMsg('Tanggal reservasi tidak boleh sebelum hari ini!');
      triggerShake();
      return;
    }
    // if (tanggal === now.tanggal && now.jam > (AKHIR_SESI[sesi] ?? '23:59')) {
    //   setErrorMsg('Jam kedatangan sudah lewat. Pilih jam yang masih ke depan.');
    //   triggerShake();
    //   return;
    // }

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
      setSesi('');
      setCatatan('');
      setRuangan('');
      setJumlah(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses reservasi.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isReady = !!selectedBranch && !!tanggal && !!sesi && jumlah>=1 && jumlah <=20;

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
              <i className="fa-solid fa-store me-2"></i>please choose a restaurant outlet!
            </Form.Label>
            <div className={styles.storeCards}>
              {branches.length === 0 ? (
                <p className="text-muted small mb-0">Loading Store...</p>
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
              
          <Form noValidate onSubmit={handleSubmit} className={`${styles.resForm} ${isShaking ? styles.shake : ''}`}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold d-flex align-items-center gap-2">
                <button type="button" 
                  className={styles.helpButton}
                  aria-expanded={showRules}
                  onClick={() => setShowRules(true)}
                >
                  !
                </button>
              </Form.Label>

              <Form.Label className="fw-bold">Full Name</Form.Label>
              <Form.Control
                type="text"
                id="res-name"
                maxLength={32}
                required
                value={nama}
                onChange={(e) => {
                  const filteredValue = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setNama(filteredValue);
                }}
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
                onChange={(e) => {
                  setTelepon(e.target.value);
                  e.target.setCustomValidity('');
                }}
              />
            </Form.Group>

            {/* Reservation Date, Time & Guests */}
            <Row className="g-3 mb-3">
              {/* Reservation Date */}
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Reservation Date</Form.Label>
                  <Form.Control
                    type="date"
                    className={styles.reservationField}
                    id="res-date"
                    required
                    min={hariIni || undefined}
                    value={tanggal}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && value < hariIni) {
                        setErrorMsg('Tanggal reservasi tidak boleh sebelum hari ini!');
                        return;
                      }
                      setTanggal(value);
                      setErrorMsg('');
                    }}
                  />
                </Form.Group>
              </Col>

              {/* Time */}
              <Col xs={6} md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold">Time</Form.Label>
                  <button
                    type="button"
                    className={styles.guestButton}
                    onClick={() => setShowTimePicker(true)}
                  >
                    {sesi || 'Select Time'}
                  </button>
                </Form.Group>
              </Col>

              {/* Guests */}
              <Col xs={6} md={3}>
                <Form.Group>
                  <Form.Label className="fw-bold">Guests</Form.Label>
                  <button
                    type="button"
                    id="res-guest"
                    className={styles.guestButton}
                    onClick={() => setShowGuestPicker(true)}
                  >
                    {jumlah}
                  </button>
                </Form.Group>
              </Col>
            </Row>

            {/* Select The Room */}
            <Row className="g-3 mb-3">
              <Col xs={12}>
                <Form.Group
                  className={`${styles.roomGroup} ${!isReady ? styles.roomLocked : ''}`}
                >
                  <Form.Label className="fw-bold">
                    Select The Room
                  </Form.Label>

                  <Form.Select
                    id="res-room"
                    required
                    disabled={!isReady}
                    value={ruangan}
                    onChange={(e) => setRuangan(e.target.value)}
                  >
                    <option value="" disabled>
                      -- Type of Room --
                    </option>

                    <optgroup label="Reguler">
                      {!terisi.includes('reguler-indoor') && (
                        <option value="reguler-indoor">
                          Reguler Indoor (No Smoking / AC)
                        </option>
                      )}

                      {!terisi.includes('reguler-outdoor') && (
                        <option value="reguler-outdoor">
                          Reguler Outdoor (Free Smoking)
                        </option>
                      )}
                    </optgroup>

                    <optgroup label="VIP Room">
                      {!terisi.includes('vip-10') && (
                        <option value="vip-10">
                          VIP Room 1 (1 Table, Recommended for 4 - 10 people)
                        </option>
                      )}

                      {!terisi.includes('vip-10-tv') && (
                        <option value="vip-10-tv">
                          VIP Room 1 ++ (1 Table + TV, Recommended for 4 - 10 people)
                        </option>
                      )}

                      {!terisi.includes('vip-20') && (
                        <option value="vip-20">
                          VIP Room 2 (2 Table, Recommended for 8 - 20 people)
                        </option>
                      )}

                      {!terisi.includes('vip-20-tv') && (
                        <option value="vip-20-tv">
                          VIP Room 2 ++ (2 Table + TV, Recommended for 8 - 20 people)
                        </option>
                      )}
                    </optgroup>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
                        
            {showGuestPicker && (
              <div
                className={styles.guestOverlay}
                onClick={() => setShowGuestPicker(false)}
              >
                <div
                  className={styles.guestModal}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Select number of guests"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    className={styles.guestClose}
                    onClick={() => setShowGuestPicker(false)}
                    aria-label="Close guest picker"
                  >
                    &times;
                  </button>

                  {/* Header */}
                  <div className={styles.guestHeader}>
                    <span>{jumlah} {jumlah === 1 ? 'Guest' : 'Guests'}</span>
                    <span>Guests</span>
                  </div>

                  {/* Number List */}
                  <div className={styles.guestList}>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`${styles.guestOption} ${
                          jumlah === n ? styles.guestActive : ''
                        }`}
                        onClick={() => {
                          setJumlah(n);
                          setShowGuestPicker(false);
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* Time Picker */}
            {showTimePicker && (
              <div
                className={styles.guestOverlay}
                onClick={() => setShowTimePicker(false)}
              >
                <div
                  className={styles.guestModal}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Select reservation time"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    className={styles.guestClose}
                    onClick={() => setShowTimePicker(false)}
                    aria-label="Close time picker"
                  >
                    &times;
                  </button>

                  {/* Header */}
                  <div className={styles.guestHeader}>
                    <span>Time</span>
                    <span>All times</span>
                  </div>

                  {/* Time Options */}
                  <div className={styles.guestList}>
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`${styles.guestOption} ${
                          sesi === time ? styles.guestActive : ''
                        }`}
                        onClick={() => {
                          setSesi(time);
                          setShowTimePicker(false);
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Extra Note</Form.Label>
              <Form.Control
                as="textarea"
                id="res-notes"
                maxLength={250}
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
              {submitting ? 'Memproses Reservasi...' : 'Submit'}
            </Button>
          </Form>
        </Container>
      )}
      {showRules && (
        <div role="presentation" onClick={() => setShowRules(false)} className= {styles.RulesOver}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-rules-title"
            onClick={(e) => e.stopPropagation()}
            className={styles.rulesModal}
          >
            <div className={styles.rulesHeader}>
              <h2
                id="reservation-rules-title"
                className={styles.rulesTitle}
              > Reservation Rules
              </h2>

              <button
                type="button"
                aria-label="Tutup aturan reservasi"
                onClick={() => setShowRules(false)}
                className={styles.rulesClose}
              > X
              </button>
            </div>

            <div className={styles.rulesContent}>
              {/* <p className={styles.rulesIntro}>
                Please read the following rules before submitting your reservation.
              </p> */}
              <ol className={styles.rulesList}>
                <span>
                  Open daily from 8:00 AM to 10:00 PM according to Western Indonesian Time (WIB). 
                  Once your reservation is confirmed, we’ll start setting up the dining area 15 minutes before your schedule time, and
                  We will hold your table for a <strong>maximum of 30 minutes</strong> past your reservation time. No outside drinks & foods are allowed. 
                  All card games, drugs, firearms & sharp objects are strictly prohibited. We reserve the right to refuse service to anyone. 
                  Proper attire is required.
                </span>
              </ol>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}