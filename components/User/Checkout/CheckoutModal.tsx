'use client';

import { useEffect, useState } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { CartItem } from '../FloatingButton/FloatingButton';
import { BranchMap } from '../Reservation/ReservationSection';
import { hitungJarakKm, hitungOngkir, formatKm, ONGKIR_TARIF } from '@/lib/deliveryFee';
import { BATAS_BAYAR_EWALLET_DETIK, BATAS_BAYAR_KASIR_DETIK } from '@/lib/paymentTimeout';
import DeliveryPicker from './DeliveryPicker';
import BranchSelect from './BranchSelect';
import styles from './CheckoutModal.module.css';
import { buildReceiptHtml, type Receipt, type OrderType } from '@/lib/receiptPrint';

interface CheckoutModalProps {
  show: boolean;
  cartItems: CartItem[];
  branches: BranchMap[];
  userName?: string;
  onClose: () => void;
  onOrderCreated?: (orderId: number) => void;
  onSuccess: (orderId: number) => void;
  resumeOrderId?: number | null;
  onPendingChange?: (orderId: number | null) => void;
}

type PayKey = 'cash' | 'ewallet';
type Step = 'form' | 'cashier' | 'ewallet' | 'verifying' | 'receipt' | 'cancelled';

const EWALLETS = [
  { nama: 'GoPay', logo: '/img/ewallet/gopay.png' },
  { nama: 'OVO', logo: '/img/ewallet/ovo.png' },
  { nama: 'DANA', logo: '/img/ewallet/dana.png' },
  { nama: 'ShopeePay', logo: '/img/ewallet/shopeepay.png' },
];
const PAY_TIMEOUT = BATAS_BAYAR_EWALLET_DETIK; // batas waktu bayar e-wallet
const POLL_MS = 4000;

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const mmss = (s: number) =>
  `${String(Math.floor(Math.max(s, 0) / 60)).padStart(2, '0')}:${String(Math.max(s, 0) % 60).padStart(2, '0')}`;
const hasCoord = (b: BranchMap) => Number.isFinite(b.latitude) && Number.isFinite(b.longitude);

export const PENDING_ORDER_KEY = 'papeda_pesanan_aktif';

function clearPending(id: number, notify?: (orderId: number | null) => void) {
  try {
    if (localStorage.getItem(PENDING_ORDER_KEY) === String(id)) {
      localStorage.removeItem(PENDING_ORDER_KEY);
      notify?.(null);
    }
  } catch {
  }
}

interface OrderApi {
  id: number;
  nama: string;
  item: string;
  total: number;
  status: string;
  status_bayar: string;
  created_at: string;
}

function receiptFromOrder(o: OrderApi): Receipt {
  let d: Record<string, unknown> = {};
  try {
    const p = JSON.parse(o.item);
    if (p && typeof p === 'object') d = p;
  } catch {
  }
  const orderType: OrderType = d.metode === 'online' ? 'online' : 'dine-in';
  const ongkir = Number(d.ongkir || 0);
  const total = Number(o.total || 0);
  return {
    id: o.id,
    tanggal: new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
    nama: o.nama,
    orderType,
    gerai: String(d.gerai || ''),
    alamat: orderType === 'online' ? String(d.lokasi_atau_alamat || '') : '',
    jarakKm: orderType === 'online' && typeof d.jarak_km === 'number' ? d.jarak_km : null,
    items: Array.isArray(d.daftar_menu) ? (d.daftar_menu as CartItem[]) : [],
    subtotal: total - ongkir,
    ongkir,
    total,
    metodeBayar: String(d.metode_bayar || ''),
    statusBayar: o.status_bayar || String(d.status_bayar || 'Belum Dibayar'),
    catatan: '',
  };
}

const payOptions = (type: OrderType): { key: PayKey; icon: string; title: string; desc: string }[] => [
  type === 'dine-in'
    ? { key: 'cash', icon: 'fa-cash-register', title: 'Bayar di Kasir', desc: 'Tunai / kartu' }
    : { key: 'cash', icon: 'fa-money-bill-wave', title: 'Bayar di Tempat (COD)', desc: 'Bayar tunai ke kurir saat pesanan tiba' },
  { key: 'ewallet', icon: 'fa-wallet', title: 'E-Wallet', desc: 'GoPay, OVO, DANA, ShopeePay' },
];

export default function CheckoutModal({
  show,
  cartItems,
  branches,
  userName = 'Pelanggan',
  onClose,
  onOrderCreated,
  onSuccess,
  resumeOrderId = null,
  onPendingChange,
}: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('form');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [payment, setPayment] = useState<PayKey>('cash');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [deliveryBranchId, setDeliveryBranchId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [userCoord, setUserCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [ewallet, setEwallet] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(PAY_TIMEOUT);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);

  // timer batas bayar
  useEffect(() => {
    if (step !== 'ewallet') return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step]);

  // waktu bayar e-wallet habis: pesanan dibatalkan otomatis
  useEffect(() => {
    if (step !== 'ewallet' || !receipt || secondsLeft > 0) return;
    const timer = setTimeout(() => {
      fetch(`/api/pesanan/${receipt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dibatalkan' }),
      }).catch(() => {});
      clearPending(receipt.id, onPendingChange);
      setStep('cancelled');
    }, 0);
    return () => clearTimeout(timer);
  }, [step, secondsLeft, receipt, onPendingChange]);

  // cek ke server tiap beberapa detik, struk baru muncul setelah kasir menandai lunas
  const waitingId = step === 'cashier' ? receipt?.id : undefined;
  useEffect(() => {
    if (!waitingId) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/pesanan/${waitingId}`);
        if (!res.ok) return;
        const { data } = await res.json();
        if (data.status === 'dibatalkan') {
          clearPending(waitingId, onPendingChange);
          setStep('cancelled');
        } else if (data.status !== 'menunggu_bayar') {
          clearPending(waitingId, onPendingChange);
          onSuccess(waitingId);
          setReceipt((r) =>
            r ? { ...r, statusBayar: 'Lunas', catatan: 'Terima kasih, pembayaran Anda sudah kami terima.' } : r
          );
          setStep('receipt');
        }
      } catch {
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [waitingId, onPendingChange]);

  useEffect(() => {
    if (!show || !resumeOrderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/pesanan/${resumeOrderId}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !json?.data) {
          clearPending(resumeOrderId, onPendingChange);
          onClose();
          return;
        }
        const data = json.data as OrderApi;
        const r = receiptFromOrder(data);
        if (data.status === 'dibatalkan') {
          clearPending(resumeOrderId, onPendingChange);
          setReceipt(r);
          setStep('cancelled');
        } else if (data.status === 'menunggu_bayar') {
          setReceipt(r);
          if (r.metodeBayar.startsWith('E-Wallet')) {
            // lanjutkan pembayaran e-wallet dengan sisa waktu yang tersisa
            const terpakai = Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000);
            setSecondsLeft(PAY_TIMEOUT - Math.max(terpakai, 0));
            setStep('ewallet');
          } else {
            setStep('cashier');
          }
        } else {
          clearPending(resumeOrderId, onPendingChange);
          onSuccess(resumeOrderId);
          setReceipt({ ...r, statusBayar: 'Lunas', catatan: 'Terima kasih, pembayaran Anda sudah kami terima.' });
          setStep('receipt');
        }
      } catch {
        if (!cancelled) setErrorMsg('Gagal memuat pesanan. Periksa koneksi Anda.');
      } finally {
        if (!cancelled) setResumeLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [show, resumeOrderId]);

  if (!show) return null;

  const deliveryBranch = branches.find((b) => String(b.id) === deliveryBranchId);
  const jarakKm: number | null =
    userCoord && deliveryBranch && hasCoord(deliveryBranch)
      ? hitungJarakKm(userCoord.lat, userCoord.lng, deliveryBranch.latitude, deliveryBranch.longitude)
      : null;
  const ongkirHitung = jarakKm !== null ? hitungOngkir(jarakKm) : null;
  const diLuarJangkauan = jarakKm !== null && ongkirHitung === null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.harga * item.quantity, 0);
  const ongkir = orderType === 'online' ? (ongkirHitung ?? 0) : 0;
  const totalBayar = subtotal + ongkir;
  const options = payOptions(orderType);
  const expired = secondsLeft <= 0;
  const resuming = !!resumeOrderId && !resumeLoaded;

  const resetAll = () => {
    setStep('form');
    setReceipt(null);
    setResumeLoaded(false);
    setErrorMsg('');
    setEwallet('');
    setSecondsLeft(PAY_TIMEOUT);
  };

  const updateOrder = (id: number, body: Record<string, string>) =>
    fetch(`/api/pesanan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const handleClose = () => {
    if (step === 'ewallet' && receipt) {
      if (expired) {
        updateOrder(receipt.id, { status: 'dibatalkan' }).catch(() => {});
      } else {
        // ditutup sementara: pesanan tetap menunggu, bisa dibuka lagi lewat tombol "Pesanan menunggu pembayaran",
        // dan baru dibatalkan otomatis kalau waktu pembayaran habis
        try {
          localStorage.setItem(PENDING_ORDER_KEY, String(receipt.id));
        } catch {
        }
        onPendingChange?.(receipt.id);
      }
    }
    resetAll();
    onClose();
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Browser tidak mendukung lokasi. Tentukan lokasi dengan mengetuk peta.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoord(coord);
        // akan otomatis pilih gerai terdekat kalau tidak pilih gerai
        if (!deliveryBranchId) {
          let best: { id: number; km: number } | null = null;
          branches.filter(hasCoord).forEach((b) => {
            const km = hitungJarakKm(coord.lat, coord.lng, b.latitude, b.longitude);
            if (!best || km < best.km) best = { id: b.id, km };
          });
          if (best) setDeliveryBranchId(String((best as { id: number }).id));
        }
        setGeoLoading(false);
      },
      () => {
        setGeoError('Lokasi tidak bisa diakses. Izinkan akses lokasi atau ketuk peta untuk menentukan lokasi.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = async () => {
    if (orderType === 'dine-in' && !selectedBranch) {
      setErrorMsg('Pilih gerai restoran terlebih dahulu.');
      return;
    }
    if (orderType === 'online') {
      if (!deliveryBranch) return setErrorMsg('Pilih gerai yang akan mengantar pesanan Anda.');
      if (!deliveryAddress.trim()) return setErrorMsg('Masukkan alamat pengiriman Anda.');
      if (jarakKm === null) return setErrorMsg('Tentukan lokasi pengantaran dulu (ketuk peta atau pakai lokasi Anda).');
      if (diLuarJangkauan) return setErrorMsg(`Alamat di luar jangkauan pengantaran (maksimal ${ONGKIR_TARIF.maksKm} km).`);
    }

    const metodeBayar = options.find((o) => o.key === payment)!.title;
    const isCod = orderType === 'online' && payment === 'cash';
    const gerai = orderType === 'dine-in' ? selectedBranch : deliveryBranch!.nama;
    const alamat = orderType === 'online' ? deliveryAddress.trim() : '';
    const statusPesanan = isCod ? 'pending' : 'menunggu_bayar';
    const statusBayar = 'Belum Dibayar';

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/pesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: userName || 'Pelanggan',
          item: JSON.stringify({
            metode: orderType,
            gerai,
            lokasi_atau_alamat: orderType === 'dine-in' ? gerai : alamat,
            jarak_km: orderType === 'online' ? Number(jarakKm!.toFixed(1)) : null,
            daftar_menu: cartItems,
            ongkir,
            metode_bayar: metodeBayar,
            status_bayar: statusBayar,
          }),
          total: totalBayar,
          status: statusPesanan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pesanan.');

      const orderId: number = data.pesanan?.id || 1;
      const created = data.pesanan?.created_at ? new Date(data.pesanan.created_at) : new Date();

      setReceipt({
        id: orderId,
        tanggal: created.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
        nama: userName || 'Pelanggan',
        orderType,
        gerai,
        alamat,
        jarakKm: orderType === 'online' ? jarakKm : null,
        items: cartItems.map((i) => ({ ...i })),
        subtotal,
        ongkir,
        total: totalBayar,
        metodeBayar,
        statusBayar,
        catatan: isCod ? 'Siapkan uang pas dan bayar ke kurir saat pesanan tiba.' : '',
      });
      onOrderCreated?.(orderId);
      if (isCod) onSuccess(orderId);

      setSecondsLeft(PAY_TIMEOUT);
      if (isCod) {
        setStep('receipt');
      } else if (payment === 'cash') {
        try {
          localStorage.setItem(PENDING_ORDER_KEY, String(orderId));
        } catch {
        }
        onPendingChange?.(orderId);
        setStep('cashier');
      } else {
        setStep(payment);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaid = async () => {
    if (!receipt) return;
    const from = step;
    const metode = `E-Wallet (${ewallet})`;
    setStep('verifying');
    setErrorMsg('');
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await updateOrder(receipt.id, { status: 'pending', status_bayar: 'Lunas', metode_bayar: metode });
      if (!res.ok) throw new Error('Gagal memverifikasi pembayaran.');
      setReceipt({
        ...receipt,
        metodeBayar: metode,
        statusBayar: 'Lunas',
        catatan: 'Terima kasih, pembayaran Anda sudah kami terima.',
      });
      clearPending(receipt.id, onPendingChange);
      setStep('receipt');
      onSuccess(receipt.id);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Pembayaran gagal diverifikasi.');
      setStep(from);
    }
  };

  const handleCancelPayment = () => {
    if (receipt) {
      updateOrder(receipt.id, { status: 'dibatalkan' }).catch(() => {});
      clearPending(receipt.id, onPendingChange);
    }
    resetAll();
    onClose();
  };

  const handlePrint = () => {
    if (!receipt) return;
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) return;
    w.document.write(buildReceiptHtml(receipt));
    w.document.close();
  };

  const lunas = receipt?.statusBayar === 'Lunas';
  const header: Record<Step, { icon: string; title: string }> = {
    form: { icon: 'fa-receipt', title: 'Konfirmasi Pesanan' },
    cashier: { icon: 'fa-cash-register', title: 'Menunggu Pembayaran' },
    ewallet: { icon: 'fa-wallet', title: 'Bayar dengan E-Wallet' },
    verifying: { icon: 'fa-hourglass-half', title: 'Memverifikasi Pembayaran' },
    receipt: { icon: 'fa-check', title: lunas ? 'Pembayaran Berhasil' : 'Pesanan Diterima' },
    cancelled: { icon: 'fa-xmark', title: 'Pesanan Dibatalkan' },
  };

  const confirmLabel =
    payment === 'cash' ? 'Konfirmasi Pesanan' : 'Lanjut ke E-Wallet';

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      backdrop="static"
      className={styles.checkoutModal}
      backdropClassName={styles.checkoutBackdrop}
      contentClassName={styles.checkoutContent}
    >
      <Modal.Header closeButton className={styles.checkoutHeader}>
        <Modal.Title className={`${styles.checkoutTitle} fw-bold d-flex align-items-center gap-2`}>
          <div className={styles.gateIcon}>
            <i className={`fa-solid ${header[step].icon}`}></i>
          </div>
          {header[step].title}
        </Modal.Title>
      </Modal.Header>

      {/* Bayar di kasir */}
      {step === 'cashier' && receipt && (
        <>
          <Modal.Body className={styles.checkoutBody}>
            <div className={styles.stepWrap}>
              <div className={styles.stepIcon}><i className="fa-solid fa-cash-register"></i></div>
              <h5 className={styles.stepTitle}>Silakan datang ke kasir</h5>
              <p className={styles.stepDesc}>
                Sebutkan nomor pesanan ini ke kasir di <strong>{receipt.gerai}</strong> dan lakukan pembayaran.
              </p>
              <div className={styles.orderBox}>
                <span className={styles.orderBoxLabel}>No. Pesanan</span>
                <span className={styles.orderBoxNumber}>#{receipt.id}</span>
                <span className={styles.orderBoxLabel}>Total yang dibayar</span>
                <strong>{rupiah(receipt.total)}</strong>
              </div>
              <div className={styles.waitRow}>
                <Spinner animation="border" size="sm" /> Menunggu konfirmasi kasir...
              </div>
              <p className={styles.hint}>Struk akan muncul otomatis begitu kasir menerima pembayaran Anda.</p>
              <p className={styles.hint}>
                Pesanan dibatalkan otomatis jika belum dibayar dalam {Math.round(BATAS_BAYAR_KASIR_DETIK / 60)} menit.
              </p>
              <p className={styles.hint}>
                Jendela ini boleh ditutup. Pesanan tetap tersimpan dan bisa dibuka lagi lewat tombol &quot;Pesanan menunggu pembayaran&quot;.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className={styles.checkoutFooter}>
            <Button variant="outline-secondary" className={`${styles.receiptBtn} w-100`} onClick={handleClose}>
              Tutup
            </Button>
          </Modal.Footer>
        </>
      )}

      {/* E-WALLET */}
      {step === 'ewallet' && receipt && (
        <>
          <Modal.Body className={styles.checkoutBody}>
            <div className={styles.stepWrap}>
              <p className={styles.stepDesc}>Pilih e-wallet yang ingin dipakai.</p>
              <div className={styles.providerGrid}>
                {EWALLETS.map((w) => (
                  <button
                    key={w.nama}
                    type="button"
                    className={`${styles.providerBtn} ${ewallet === w.nama ? styles.providerBtnActive : ''}`}
                    aria-label={w.nama}
                    aria-pressed={ewallet === w.nama}
                    onClick={() => setEwallet(w.nama)}
                  >
                    <img src={w.logo} alt={w.nama} className={styles.providerLogo} />
                  </button>
                ))}
              </div>
              <div className={styles.orderBox}>
                <span className={styles.orderBoxLabel}>Total yang dibayar</span>
                <strong>{rupiah(receipt.total)}</strong>
              </div>
              <div className={`${styles.timer} ${expired ? styles.timerExpired : ''}`}>
                {expired ? 'Waktu pembayaran habis' : `Selesaikan dalam ${mmss(secondsLeft)}`}
              </div>
              <p className={styles.hint}>Catatan: aplikasi e-wallet tidak benar-benar dibuka.</p>
              <p className={styles.hint}>Jendela ini boleh ditutup, pesanan tetap menunggu sampai waktu habis.</p>
            </div>
            {errorMsg && <div className={styles.checkoutError} role="alert">{errorMsg}</div>}
          </Modal.Body>
          <Modal.Footer className={styles.checkoutFooter}>
            <Button variant="outline-secondary" className={`${styles.receiptBtn} flex-fill`} onClick={handleCancelPayment}>
              Batalkan
            </Button>
            <Button
              variant="papeda"
              className="flex-fill text-white fw-bold"
              disabled={!ewallet || expired}
              onClick={handleSimulatePaid}
            >
              {ewallet ? `Bayar via ${ewallet}` : 'Pilih e-wallet'}
            </Button>
          </Modal.Footer>
        </>
      )}

      {step === 'verifying' && (
        <Modal.Body className={styles.checkoutBody}>
          <div className={styles.stepWrap}>
            <Spinner animation="border" />
            <h5 className={styles.stepTitle}>Memverifikasi pembayaran...</h5>
            <p className={styles.stepDesc}>Mohon tunggu sebentar, jangan tutup jendela ini.</p>
          </div>
        </Modal.Body>
      )}

      {step === 'cancelled' && (
        <>
          <Modal.Body className={styles.checkoutBody}>
            <div className={styles.stepWrap}>
              <div className={styles.stepIcon}><i className="fa-solid fa-xmark"></i></div>
              <h5 className={styles.stepTitle}>Pesanan dibatalkan</h5>
              <p className={styles.stepDesc}>
                {receipt?.metodeBayar.startsWith('E-Wallet')
                  ? 'Pesanan ini dibatalkan karena waktu pembayaran habis atau oleh kasir. Silakan pesan ulang atau hubungi gerai.'
                  : 'Pesanan ini dibatalkan karena belum dibayar dalam batas waktu atau dibatalkan oleh kasir. Silakan pesan ulang atau hubungi gerai.'}
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className={styles.checkoutFooter}>
            <Button variant="papeda" className="w-100 text-white fw-bold" onClick={handleClose}>Tutup</Button>
          </Modal.Footer>
        </>
      )}

      {/* STRUK */}
      {step === 'receipt' && receipt && (
        <>
          <Modal.Body className={styles.checkoutBody}>
            <div className={styles.receiptWrap}>
              <div className={styles.receiptPaper}>
                <div className={styles.receiptBrand}>PAPEDA</div>
                <div className={styles.receiptSub}>Restoran Makanan Nusantara</div>
                <div className={styles.receiptSub}><strong>{lunas ? 'STRUK PEMBAYARAN' : 'NOTA PESANAN'}</strong></div>

                <div className={styles.receiptDivider} />
                <div className={styles.receiptRow}><span>No. Pesanan</span><strong>#{receipt.id}</strong></div>
                <div className={styles.receiptRow}><span>Tanggal</span><span>{receipt.tanggal}</span></div>
                <div className={styles.receiptRow}><span>Pelanggan</span><span>{receipt.nama}</span></div>
                <div className={styles.receiptRow}>
                  <span>Metode</span>
                  <span>{receipt.orderType === 'dine-in' ? 'Makan di Tempat' : 'Pesan Antar'}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Gerai</span>
                  <span className={styles.receiptRight}>{receipt.gerai}</span>
                </div>
                {receipt.orderType === 'online' && (
                  <>
                    <div className={styles.receiptRow}>
                      <span>Alamat</span>
                      <span className={styles.receiptRight}>{receipt.alamat}</span>
                    </div>
                    {receipt.jarakKm !== null && (
                      <div className={styles.receiptRow}>
                        <span>Jarak</span><span>± {formatKm(receipt.jarakKm)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className={styles.receiptDivider} />
                {receipt.items.map((i) => (
                  <div key={i.id} className={styles.receiptItem}>
                    <div className={styles.receiptRow}>
                      <span>{i.nama_makanan}</span>
                      <span>{rupiah(i.harga * i.quantity)}</span>
                    </div>
                    <div className={styles.receiptItemSub}>{i.quantity} x {rupiah(i.harga)}</div>
                  </div>
                ))}

                <div className={styles.receiptDivider} />
                <div className={styles.receiptRow}><span>Subtotal</span><span>{rupiah(receipt.subtotal)}</span></div>
                {receipt.ongkir > 0 && (
                  <div className={styles.receiptRow}><span>Ongkos Kirim</span><span>{rupiah(receipt.ongkir)}</span></div>
                )}
                <div className={`${styles.receiptRow} ${styles.receiptTotal}`}>
                  <span>TOTAL</span><span>{rupiah(receipt.total)}</span>
                </div>

                <div className={styles.receiptDivider} />
                <div className={styles.receiptRow}><span>Pembayaran</span><span>{receipt.metodeBayar}</span></div>
                <div className={styles.receiptRow}>
                  <span>Status</span>
                  <span className={`${styles.receiptBadge} ${lunas ? styles.badgePaid : styles.badgeUnpaid}`}>
                    {receipt.statusBayar}
                  </span>
                </div>

                <div className={styles.receiptNote}>{receipt.catatan}</div>
                <div className={styles.receiptThanks}>
                  {receipt.orderType === 'dine-in' ? 'Terima kasih telah makan di Papeda' : 'Terima kasih telah memesan di Papeda'}
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className={styles.checkoutFooter}>
            <Button variant="outline-secondary" className={`${styles.receiptBtn} flex-fill`} onClick={handlePrint}>
              <i className="fa-solid fa-print me-2"></i>{lunas ? 'Cetak Struk' : 'Cetak Nota'}
            </Button>
            <Button variant="papeda" className="flex-fill text-white fw-bold" onClick={handleClose}>
              Selesai
            </Button>
          </Modal.Footer>
        </>
      )}

      {resuming && (
        <Modal.Body className={styles.checkoutBody}>
          <div className={styles.stepWrap}>
            <Spinner animation="border" />
            <p className={styles.stepDesc}>Memuat pesanan...</p>
          </div>
        </Modal.Body>
      )}

      {step === 'form' && !resuming && (
        <>
          <Modal.Body className={styles.checkoutBody}>
            <p className={styles.sectionTitle}>Metode pesanan</p>
            <div className={styles.typeGroup} role="group">
              <button
                type="button"
                className={`${styles.typeBtn} ${orderType === 'dine-in' ? styles.typeBtnActive : ''}`}
                onClick={() => setOrderType('dine-in')}
              >
                <i className="fa-solid fa-store"></i> Makan di Tempat
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${orderType === 'online' ? styles.typeBtnActive : ''}`}
                onClick={() => setOrderType('online')}
              >
                <i className="fa-solid fa-motorcycle"></i> Pesan Antar
              </button>
            </div>

            {orderType === 'dine-in' ? (
              <Form.Group className="mb-4" controlId="dineInForm">
                <Form.Label className={styles.sectionTitle}>Pilih gerai restoran</Form.Label>
                <BranchSelect
                  branches={branches}
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                />
              </Form.Group>
            ) : (
              <>
                <Form.Group className="mb-3" controlId="deliveryBranch">
                  <Form.Label className={styles.sectionTitle}>Pilih Gerai Restoran</Form.Label>
                  <BranchSelect
                    branches={branches}
                    value={deliveryBranchId}
                    onChange={setDeliveryBranchId}
                    getValue={(b) => String(b.id)}
                    getNote={(b) =>
                      userCoord && hasCoord(b)
                        ? `± ${formatKm(hitungJarakKm(userCoord.lat, userCoord.lng, b.latitude, b.longitude))}`
                        : null
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="onlineForm">
                  <Form.Label className={styles.sectionTitle}>Alamat pengiriman</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    className={styles.customInput}
                    placeholder="Masukkan alamat lengkap Anda..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                </Form.Group>

                <p className={styles.sectionTitle}>Lokasi pengantaran</p>
                <div className="mb-4">
                  <Button
                    variant="outline-secondary"
                    className={`${styles.receiptBtn} w-100`}
                    disabled={geoLoading}
                    onClick={handleUseLocation}
                  >
                    {geoLoading ? (
                      <><Spinner animation="border" size="sm" className="me-2" />Mencari lokasi...</>
                    ) : (
                      <><i className="fa-solid fa-location-crosshairs me-2"></i>{userCoord ? 'Perbarui lokasi saya' : 'Gunakan lokasi saya'}</>
                    )}
                  </Button>
                  {geoError && <div className={styles.hint}>{geoError}</div>}
                  {deliveryBranch && !hasCoord(deliveryBranch) && (
                    <div className={styles.hint}>Gerai ini belum punya koordinat, silakan pilih gerai lain.</div>
                  )}
                  {!deliveryBranch && <div className={styles.hint}>Pilih gerai dulu untuk menampilkan peta.</div>}
                  {deliveryBranch && hasCoord(deliveryBranch) && (
                    <>
                      <div className={styles.hint}>Atau ketuk peta / geser pin untuk menentukan lokasi pengantaran.</div>
                      <DeliveryPicker
                        branchLat={deliveryBranch.latitude}
                        branchLng={deliveryBranch.longitude}
                        branchName={deliveryBranch.nama}
                        value={userCoord}
                        onPick={setUserCoord}
                      />
                    </>
                  )}
                  {jarakKm !== null && (
                    <div className={diLuarJangkauan ? styles.distanceBad : styles.distanceInfo}>
                      {diLuarJangkauan
                        ? `Jarak ± ${formatKm(jarakKm)}, di luar jangkauan (maks ${ONGKIR_TARIF.maksKm} km).`
                        : `Jarak ± ${formatKm(jarakKm)} dari ${deliveryBranch?.nama}`}
                    </div>
                  )}
                </div>
              </>
            )}

            <p className={styles.sectionTitle}>Metode pembayaran</p>
            <div className={styles.payList} role="radiogroup">
              {options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={payment === o.key}
                  className={`${styles.payCard} ${payment === o.key ? styles.payCardActive : ''}`}
                  onClick={() => setPayment(o.key)}
                >
                  <span className={styles.payIcon}><i className={`fa-solid ${o.icon}`}></i></span>
                  <span className={styles.payText}>
                    <strong>{o.title}</strong>
                    <small>{o.desc}</small>
                  </span>
                  <span className={styles.payRadio}></span>
                </button>
              ))}
            </div>

            <div className={styles.checkoutSummary}>
              <div className={styles.summaryRow}>
                <span>Subtotal Makanan</span>
                <span className="fw-bold">{rupiah(subtotal)}</span>
              </div>
              {orderType === 'online' && (
                <div className={styles.summaryRow}>
                  <span>Ongkos Kirim{jarakKm !== null && !diLuarJangkauan ? ` (± ${formatKm(jarakKm)})` : ''}</span>
                  <span className="fw-bold">
                    {ongkirHitung !== null ? `+ ${rupiah(ongkirHitung)}` : 'Tentukan jarak dulu'}
                  </span>
                </div>
              )}
              <div className={styles.summaryTotal}>
                <span>Total Bayar</span>
                <span>{rupiah(totalBayar)}</span>
              </div>
            </div>

            {errorMsg && <div className={styles.checkoutError} role="alert">{errorMsg}</div>}
          </Modal.Body>

          <Modal.Footer className={styles.checkoutFooter}>
            <Button
              variant="papeda"
              className="w-100 text-white fw-bold py-2"
              disabled={loading || cartItems.length === 0}
              onClick={handleConfirm}
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  {confirmLabel} <i className="fa-solid fa-arrow-right ms-2"></i>
                </>
              )}
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
