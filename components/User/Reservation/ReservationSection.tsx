'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import styles from './ReservationSection.module.css';
import { JAM_RESERVASI } from '@/lib/jam';
import { KODE_RUANGAN, INFO_TIPE, type TipeMeja } from '@/lib/mejaTipe';
import { namaSingkatGerai } from '@/lib/gerai';

const sekarangLokal = () => {
  const d = new Date();
  const dua = (n: number) => String(n).padStart(2, '0');

  return {
    tanggal: `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`,
    jam: `${dua(d.getHours())}:${dua(d.getMinutes())}`,
  };
};

const HARI = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatTanggal = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${HARI[new Date(y, m - 1, d).getDay()]} ${d} ${BULAN[m - 1]}`;
};

const LABEL_TIPE: Record<TipeMeja, string> = { indoor: 'Indoor', outdoor: 'Outdoor', vip: 'VIP' };

export interface BranchMap {
  id: number;
  nama: string;
  alamat: string;
  latitude: number;
  longitude: number;
}

interface MejaPublik {
  id: number;
  tipe: TipeMeja;
  nomor: number;
  kapMin: number;
  kapMaks: number;
  open: boolean;
  dipesan: boolean;
  bisaDipilih: boolean;
  catatan: string;
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
  const [tipe, setTipe] = useState<TipeMeja | ''>('');
  const [mejaId, setMejaId] = useState<number | null>(null);
  const [mejaList, setMejaList] = useState<MejaPublik[]>([]);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hariIni, setHariIni] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasViewedRules, setHasViewedRules] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  useEffect(() => {
    if (!showConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) setShowConfirm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showConfirm, submitting]);

  useEffect(() => {
    const timer = setTimeout(() => setHariIni(sekarangLokal().tanggal), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedBranch || !tanggal || !sesi || !tipe) return;
    let batal = false;
    const params = new URLSearchParams({ gerai: selectedBranch, tanggal, jam: sesi, tipe });

    fetch(`/api/meja?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!batal) setMejaList(d.data ?? []);
      })
      .catch(() => {});

    return () => {
      batal = true;
    };
  }, [selectedBranch, tanggal, sesi, tipe]);

  const isReady = !!selectedBranch && !!tanggal && !!sesi && jumlah >= 1 && jumlah <= 20;
  const daftarMeja = isReady && tipe ? mejaList.filter((m) => m.tipe === tipe) : [];
  const bisaPilih = (m: MejaPublik) => m.bisaDipilih && jumlah >= m.kapMin && jumlah <= m.kapMaks;
  const mejaTerpilih = daftarMeja.find((m) => m.id === mejaId && bisaPilih(m)) ?? null;

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
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/.test(email.trim())) {
      setErrorMsg('Format email tidak valid!');
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
    if (!tipe) {
      setErrorMsg('Silakan pilih tipe ruangan!');
      triggerShake();
      return;
    }
    if (!mejaTerpilih) {
      setErrorMsg('Silakan pilih nomor meja!');
      triggerShake();
      return;
    }
    const now = sekarangLokal();
    if (tanggal < now.tanggal) {
      setErrorMsg('Tanggal reservasi tidak boleh sebelum hari ini!');
      triggerShake();
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!user || !tipe || !mejaTerpilih) return;

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
          ruangan: KODE_RUANGAN[tipe],
          meja_id: mejaTerpilih.id,
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
      setTipe('');
      setMejaId(null);
      setMejaList([]);
      setJumlah(0);
      setShowConfirm(false);   
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses reservasi.';
      setErrorMsg(msg);
      setShowConfirm(false);
      triggerShake(); 
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
          <div className={`${styles.lol}"mb-4"`}>
            <Form.Label className={styles.storeLabel}>
              <i className="fa-solid fa-store me-2"></i>Please choose a restaurant outlet&nbsp;<strong>!</strong>
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
                      onClick={() => {
                        setSelectedBranch(b.nama);
                        setMejaId(null);
                      }}
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

          <Form noValidate onSubmit={handleSubmit} className={`${styles.resForm} ${isShaking ? styles.shake : ''} mt-3`}>
            <Form.Group className="mb-3">
              <Form.Label className="fs-bold d-flex align-items-center gap-2 mb-2">
                <button type="button"
                  className={styles.RuleButton}
                  aria-expanded={showRules}
                  onClick={() => {
                    setHasViewedRules(true);
                    setShowRules(true);
                  }}
                > ! </button> 
                <span className={`${styles.resFormRules} ${!hasViewedRules? styles.warningText : ''}`}> 
                  Please read this before making a reservation.
                </span>
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
                required
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
              />
            </Form.Group>

            {/* Reservation Date, Time & Guests */}
            <Row className="g-3 mb-3">
              {/* date */}
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
                      setMejaId(null);
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

            {/* ROOM */}
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
                    disabled={!isReady}
                    value={tipe}
                    onChange={(e) => {
                      setTipe(e.target.value as TipeMeja | '');
                      setMejaId(null);
                    }}
                  >
                    <option value="">-- Type of Room --</option>
                    <option value="indoor">Reguler Indoor (No Smoking / AC)</option>
                    <option value="outdoor">Reguler Outdoor (Free Smoking)</option>
                    <option value="vip">VIP Room</option>
                  </Form.Select>

                  {tipe && (
                    <div className={styles.mejaScroll} role="listbox" aria-label="Pilih nomor meja">
                      {daftarMeja.length === 0 ? (
                        <small className="text-muted">Belum ada meja tersedia.</small>
                      ) : (
                        daftarMeja.map((m) => {
                          const ok = bisaPilih(m);
                          const alasan = m.dipesan
                            ? 'Dipesan'
                            : !m.open
                            ? 'Closed'
                            : !ok
                            ? `${m.kapMin}-${m.kapMaks} orang`
                            : '';
                          return (
                            <button
                              key={m.id}
                              type="button"
                              role="option"
                              aria-selected={mejaTerpilih?.id === m.id}
                              disabled={!ok}
                              className={`${styles.mejaTab} ${styles[`tag_${m.tipe}`]} ${
                                mejaTerpilih?.id === m.id ? styles.mejaAktif : ''
                              }`}
                              onClick={() => setMejaId(m.id)}
                            >
                              <strong>{String(m.nomor).padStart(2, '0')}</strong>
                              <span><i className="fa-solid fa-user"></i> {m.kapMin}-{m.kapMaks}</span>
                              {alasan && <small>{alasan}</small>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            
            {/* Tab pilih jumlah Guests */}
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

            {/* Tab pilih waktu */}
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
                    {JAM_RESERVASI.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`${styles.guestOption} ${
                          sesi === time ? styles.guestActive : ''
                        }`}
                        onClick={() => {
                          setSesi(time);
                          setMejaId(null);
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

      {/* Reservation Confirmation*/}
      {showConfirm && user && tipe && mejaTerpilih && (
        <div role="presentation" className={styles.guestOverlay}
             onClick={() => !submitting && setShowConfirm(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="reservation-confirm-title"
               className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>

            <div className={styles.confirmHeader}>
              <h3 id="reservation-confirm-title" className={styles.confirmTitle}>
                Selected: {LABEL_TIPE[tipe]}{' '}
                <span>(Tag: {String(mejaTerpilih.nomor).padStart(2, '0')})</span>
              </h3>
              <button type="button" className={`${styles.confirmClose} `}
                      onClick={() => setShowConfirm(false)} disabled={submitting}
                      aria-label="Close confirmation">&times;</button>
            </div>

            <div className={styles.confirmImage}>
              <Image src={INFO_TIPE[tipe].gambar} alt={INFO_TIPE[tipe].judul} fill
                     sizes="(max-width: 480px) 90vw, 380px" style={{ objectFit: 'cover' }} />
              <span className={styles.confirmImageTag}>{INFO_TIPE[tipe].judul}</span>
            </div>

            <div className={styles.confirmWhen}>
              <span><i className="fa-regular fa-calendar"></i>{formatTanggal(tanggal)}</span>
              <span className={styles.confirmDot} aria-hidden="true"></span>
              <span><i className="fa-regular fa-clock"></i>{sesi}</span>
            </div>

            <div className={styles.confirmChips}>
              <span><i className="fa-solid fa-location-dot"></i>{namaSingkatGerai(selectedBranch)}</span>
              <span><i className="fa-solid fa-user-group"></i>{jumlah} {jumlah === 1 ? 'guest' : 'guests'}</span>
            </div>

            <div className={styles.confirmAbout}>
              <h4>About</h4>
              <p>{mejaTerpilih.catatan?.trim() || 'Belum ada keterangan khusus untuk meja ini.'}</p>
            </div>

            <div className={styles.contactUs}>
              <p className={styles.contactDescription}>
                Have trouble with your reservation? Feel free to contact our admin
                for further assistance.
              </p>
              <div className = {`${styles.whatsapp} mb-3`}>
                <i className="fa-brands fa-whatsapp"> </i>
                <span> +62 856-####-####</span>
              </div>
            </div>

            <Button type="button" variant="papeda"
                    className={`${styles.confirmBtn} w-100 text-white fw-bold`}
                    disabled={submitting} onClick={handleConfirm}>
              {submitting ? 'Memproses...' : 'Confirm'}
            </Button>
          </div>
        </div>
      )}

      {/* Memperlihatkan aturan reservasi*/}
      {showRules && (
        <div role="presentation" onClick={() => setShowRules(false)} className={styles.RulesOver}>
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
              > <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className={styles.rulesContent}>
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
