'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './cashier.module.css';
import { buildReceiptHtml, type OrderType, type Receipt } from '@/lib/receiptPrint';
import type { CartItem } from '@/components/User/FloatingButton/FloatingButton';
import { BATAS_BAYAR_KASIR_DETIK } from '@/lib/paymentTimeout';
import { namaSingkatGerai } from '@/lib/gerai';

const REFRESH_MS = 4000;
const BATAS_BAYAR_MENIT = Math.round(BATAS_BAYAR_KASIR_DETIK / 60);
const BATAS_LAMA_MENIT = 15;

type KolomKey = 'menunggu_bayar' | 'pending' | 'diproses' | 'selesai';
type Aksi = 'bayar' | 'proses' | 'selesai' | 'batal';

const KOLOM: { key: KolomKey; label: string; icon: string; kosong: string }[] = [
  { key: 'menunggu_bayar', label: 'Menunggu Bayar', icon: 'fa-cash-register', kosong: 'Tidak ada yang menunggu pembayaran' },
  { key: 'pending', label: 'Antrian', icon: 'fa-hourglass-half', kosong: 'Antrian kosong' },
  { key: 'diproses', label: 'Diproses', icon: 'fa-fire-burner', kosong: 'Belum ada yang diproses' },
  { key: 'selesai', label: 'Selesai', icon: 'fa-circle-check', kosong: 'Belum ada pesanan selesai hari ini' },
];

const STATUS_AWAL: Record<Aksi, string> = {
  bayar: 'menunggu_bayar',
  batal: 'menunggu_bayar',
  proses: 'pending',
  selesai: 'diproses',
};

interface PesananApi {
  id: number;
  nama: string;
  item: string;
  total: number;
  status: string;
  created_at: string;
}

interface Pesanan {
  id: number;
  nama: string;
  total: number;
  status: string;
  createdAt: string;
  gerai: string;
  orderType: OrderType;
  alamat: string;
  jarakKm: number | null;
  metodeBayar: string;
  items: CartItem[];
  ongkir: number;
  lunas: boolean;
  kasir: boolean; // makan di tempat + bayar di kasir
  cod: boolean; // pesan antar, bayar ke kurir
}

const rupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const tglLokal = (d: Date) => d.toLocaleDateString('en-CA');
const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const geserTanggal = (tgl: string, hari: number) => {
  const d = new Date(`${tgl}T00:00:00`);
  d.setDate(d.getDate() + hari);
  return tglLokal(d);
};

const labelHari = (tgl: string, hariIni: string) => {
  if (!tgl || !hariIni) return '';
  if (tgl === hariIni) return 'Hari ini';
  if (tgl === geserTanggal(hariIni, -1)) return 'Kemarin';
  return new Date(`${tgl}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long' });
};

function PemilihTanggal({
  value,
  hariIni,
  onChange,
  label,
}: {
  value: string;
  hariIni: string;
  onChange: (tgl: string) => void;
  label: string;
}) {
  const diHariIni = value === hariIni;
  return (
    <div className={styles.tglBar} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.tglNav}
        onClick={() => onChange(geserTanggal(value, -1))}
        aria-label="Hari sebelumnya"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <label className={styles.tglField}>
        <i className="fa-regular fa-calendar"></i>
        <input
          type="date"
          value={value}
          max={hariIni}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label={label}
        />
        <span className={`${styles.tglBadge} ${diHariIni ? styles.tglBadgeIni : ''}`}>{labelHari(value, hariIni)}</span>
      </label>
      <button
        type="button"
        className={styles.tglNav}
        onClick={() => onChange(geserTanggal(value, 1))}
        disabled={diHariIni}
        aria-label="Hari berikutnya"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
      {!diHariIni && (
        <button type="button" className={styles.tglHariIni} onClick={() => onChange(hariIni)}>
          Hari ini
        </button>
      )}
    </div>
  );
}

function bacaPesanan(p: PesananApi): Pesanan {
  let d: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(p.item);
    if (parsed && typeof parsed === 'object') d = parsed;
  } catch {}

  const orderType: OrderType = d.metode === 'online' ? 'online' : 'dine-in';
  const metodeBayar = String(d.metode_bayar || '');
  const ewallet = metodeBayar.startsWith('E-Wallet');
  return {
    id: p.id,
    nama: p.nama,
    total: Number(p.total || 0),
    status: p.status,
    createdAt: p.created_at,
    gerai: String(d.gerai || ''),
    orderType,
    alamat: orderType === 'online' ? String(d.lokasi_atau_alamat || '') : '',
    jarakKm: orderType === 'online' && typeof d.jarak_km === 'number' ? d.jarak_km : null,
    metodeBayar,
    items: Array.isArray(d.daftar_menu) ? (d.daftar_menu as CartItem[]) : [],
    ongkir: Number(d.ongkir || 0),
    lunas: d.status_bayar === 'Lunas',
    kasir: orderType === 'dine-in' && metodeBayar.toLowerCase().includes('kasir'),
    cod: orderType === 'online' && !ewallet,
  };
}

function labelMetode(p: Pesanan): string {
  if (p.metodeBayar.startsWith('E-Wallet')) return 'E-Wallet';
  if (p.kasir) return 'Bayar di Kasir';
  if (p.cod) return 'COD';
  return p.metodeBayar || 'Lainnya';
}

function buatStruk(p: Pesanan): Receipt {
  return {
    id: p.id,
    tanggal: new Date(p.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
    nama: p.nama,
    orderType: p.orderType,
    gerai: p.gerai,
    alamat: p.alamat,
    jarakKm: p.jarakKm,
    items: p.items,
    subtotal: p.total - p.ongkir,
    ongkir: p.ongkir,
    total: p.total,
    metodeBayar: p.metodeBayar || 'Bayar di Kasir',
    statusBayar: p.lunas ? 'Lunas' : 'Belum Dibayar',
    catatan: p.lunas
      ? 'Terima kasih, pembayaran Anda sudah kami terima.'
      : p.cod
        ? 'Siapkan uang pas dan bayar ke kurir saat pesanan tiba.'
        : '',
  };
}

function cetakStruk(p: Pesanan) {
  const w = window.open('', '_blank', 'width=420,height=700');
  if (!w) {
    alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak struk.');
    return;
  }
  w.document.write(buildReceiptHtml(buatStruk(p)));
  w.document.close();
}

function bunyi() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1175, t + 0.2);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
    osc.onended = () => ctx.close();
  } catch {}
}

async function ubahPesanan(id: number, body: Record<string, string>) {
  const res = await fetch(`/api/cashier/pesanan/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Gagal memperbarui pesanan.');
  }
}

export default function KasirPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [daftarGerai, setDaftarGerai] = useState<string[]>([]);
  const [gerai, setGerai] = useState('');
  const [geraiBuka, setGeraiBuka] = useState(false);
  const geraiRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown gerai kalau klik di luar atau tekan Escape
  useEffect(() => {
    if (!geraiBuka) return;
    const klikLuar = (e: MouseEvent | TouchEvent) => {
      if (geraiRef.current && !geraiRef.current.contains(e.target as Node)) setGeraiBuka(false);
    };
    const tekanKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGeraiBuka(false);
    };
    document.addEventListener('mousedown', klikLuar);
    document.addEventListener('touchstart', klikLuar);
    document.addEventListener('keydown', tekanKey);
    return () => {
      document.removeEventListener('mousedown', klikLuar);
      document.removeEventListener('touchstart', klikLuar);
      document.removeEventListener('keydown', tekanKey);
    };
  }, [geraiBuka]);

  const [daftar, setDaftar] = useState<Pesanan[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [diperbarui, setDiperbarui] = useState('');
  const [now, setNow] = useState(0);

  const [kolomAktif, setKolomAktif] = useState<KolomKey>('menunggu_bayar');
  const [cari, setCari] = useState('');

  const [konfirmasiId, setKonfirmasiId] = useState<number | null>(null);
  const [sibukId, setSibukId] = useState<number | null>(null);
  const [baruDibayar, setBaruDibayar] = useState<Pesanan | null>(null);

  const [suara, setSuara] = useState(true);
  const suaraRef = useRef(true);
  const [baruIds, setBaruIds] = useState<number[]>([]);
  const prevAktif = useRef<{ gerai: string; ids: Set<number> } | null>(null);

  const [rekapBuka, setRekapBuka] = useState(false);
  const [tglRekapPilih, setTglRekapPilih] = useState('');
  const [riwayatBuka, setRiwayatBuka] = useState(false);
  const [tglRiwayatPilih, setTglRiwayatPilih] = useState('');
  const [filterRiwayat, setFilterRiwayat] = useState<'semua' | 'selesai' | 'dibatalkan'>('semua');

  // Cek sesi kasir ke server (cookie httpOnly), gerai kasir ikut dari server
  useEffect(() => {
    let batal = false;
    fetch('/api/cashier/login', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { data?: { gerai?: string } } | null) => {
        if (batal) return;
        if (d?.data?.gerai) {
          setGerai(d.data.gerai);
          setLoggedIn(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (batal) return;
        setNow(Date.now());
        setReady(true);
      });
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    fetch('/api/maps')
      .then((r) => r.json())
      .then((d: { data?: { nama: string }[] }) => {
        if (Array.isArray(d?.data)) setDaftarGerai(d.data.map((m) => m.nama).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  const muat = useCallback(async () => {
    try {
      const res = await fetch('/api/cashier/pesanan', { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401) {
        setLoggedIn(false);
        setDaftar([]);
        setMemuat(true);
        prevAktif.current = null;
        setGerai('');
        setLoginError(data?.error || 'Sesi kasir berakhir, silakan login lagi.');
        return;
      }
      if (!res.ok) throw new Error(data?.error || 'Gagal memuat pesanan.');
      const list: PesananApi[] = Array.isArray(data?.data) ? data.data : [];
      setDaftar(list.map(bacaPesanan));
      setErrorMsg('');
      const sekarang = new Date();
      setNow(sekarang.getTime());
      setDiperbarui(sekarang.toLocaleTimeString('id-ID'));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat pesanan.');
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    const first = setTimeout(muat, 0);
    const t = setInterval(muat, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [loggedIn, muat]);

  useEffect(() => {
    if (konfirmasiId === null) return;
    const t = setTimeout(() => setKonfirmasiId(null), 5000);
    return () => clearTimeout(t);
  }, [konfirmasiId]);

  const butuhTindakan = useMemo(
    () =>
      daftar.filter(
        (p) =>
          (p.status === 'pending' || (p.status === 'menunggu_bayar' && p.kasir)) &&
          (gerai === 'semua' || p.gerai === gerai),
      ),
    [daftar, gerai],
  );

  useEffect(() => {
    if (!loggedIn || memuat) return;
    const ids = new Set(butuhTindakan.map((p) => p.id));
    const prev = prevAktif.current;
    prevAktif.current = { gerai, ids };
    if (!prev || prev.gerai !== gerai) return;
    const baru = [...ids].filter((id) => !prev.ids.has(id));
    if (baru.length === 0) return;
    if (suaraRef.current) bunyi();
    const t1 = setTimeout(() => setBaruIds((s) => [...s, ...baru]), 0);
    const t2 = setTimeout(() => setBaruIds((s) => s.filter((id) => !baru.includes(id))), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [butuhTindakan, gerai, loggedIn, memuat]);

  useEffect(() => {
    if (!loggedIn) return;
    const awal = document.title;
    document.title = butuhTindakan.length > 0 ? `(${butuhTindakan.length}) Kasir Papeda` : 'Kasir Papeda';
    return () => {
      document.title = awal;
    };
  }, [butuhTindakan.length, loggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cashier/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d?.data?.gerai) {
        setLoginError(d?.error || 'Username atau password kasir salah.');
        return;
      }
      setGerai(d.data.gerai);
      setLoggedIn(true);
      setLoginError('');
      setPassword('');
    } catch {
      setLoginError('Tidak bisa terhubung ke server.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/cashier/login', { method: 'DELETE' }).catch(() => {});
    setLoggedIn(false);
    setDaftar([]);
    setMemuat(true);
    setGerai('');
    setUsername('');
    prevAktif.current = null;
  };

  const toggleSuara = () => {
    const baru = !suara;
    setSuara(baru);
    suaraRef.current = baru;
    if (baru) bunyi();
  };

  const jalankan = async (p: Pesanan, aksi: Aksi) => {
    if (aksi === 'bayar' && konfirmasiId !== p.id) {
      setKonfirmasiId(p.id);
      return;
    }
    if (aksi === 'batal' && !confirm(`Batalkan pesanan #${p.id} atas nama ${p.nama}?`)) return;

    setKonfirmasiId(null);
    setSibukId(p.id);
    setErrorMsg('');
    try {
      const cek = await fetch(`/api/cashier/pesanan/${p.id}`, { cache: 'no-store' }).then((r) => r.json());
      const statusSekarang: string | undefined = cek?.data?.status;
      if (statusSekarang !== STATUS_AWAL[aksi]) {
        throw new Error(
          `Pesanan #${p.id} sudah berubah (status: ${statusSekarang || 'tidak ditemukan'}). Papan diperbarui.`,
        );
      }
      if (aksi === 'bayar') {
        await ubahPesanan(p.id, { status: 'pending', status_bayar: 'Lunas' });
        setBaruDibayar({ ...p, status: 'pending', lunas: true });
      } else if (aksi === 'proses') {
        await ubahPesanan(p.id, { status: 'diproses' });
      } else if (aksi === 'selesai') {
        // COD: uang diterima kurir saat pesanan tiba, jadi ikut ditandai lunas
        await ubahPesanan(p.id, p.cod && !p.lunas ? { status: 'selesai', status_bayar: 'Lunas' } : { status: 'selesai' });
      } else {
        await ubahPesanan(p.id, { status: 'dibatalkan' });
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui pesanan.');
    } finally {
      setSibukId(null);
      muat();
    }
  };

  const hariIni = now ? tglLokal(new Date(now)) : '';

  const cocokCari = useCallback(
    (p: Pesanan) => {
      const k = cari.trim().toLowerCase();
      if (!k) return true;
      return String(p.id).includes(k.replace('#', '')) || p.nama.toLowerCase().includes(k);
    },
    [cari],
  );

  const diGerai = useMemo(
    () => daftar.filter((p) => gerai === 'semua' || p.gerai === gerai),
    [daftar, gerai],
  );

  const tglRekap = tglRekapPilih || hariIni;
  const tglRiwayat = tglRiwayatPilih || hariIni;

  const perKolom = useMemo(() => {
    const urutLama = (a: Pesanan, b: Pesanan) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    const urutBaru = (a: Pesanan, b: Pesanan) => urutLama(b, a);
    const hasil: Record<KolomKey, Pesanan[]> = {
      menunggu_bayar: diGerai.filter((p) => p.status === 'menunggu_bayar' && p.kasir && cocokCari(p)).sort(urutLama),
      pending: diGerai.filter((p) => p.status === 'pending' && cocokCari(p)).sort(urutLama),
      diproses: diGerai.filter((p) => p.status === 'diproses' && cocokCari(p)).sort(urutLama),
      selesai: diGerai
        .filter(
          (p) => p.status === 'selesai' && hariIni !== '' && tglLokal(new Date(p.createdAt)) === hariIni && cocokCari(p),
        )
        .sort(urutBaru),
    };
    return hasil;
  }, [diGerai, cocokCari, hariIni]);

  const hitungRekap = useCallback(
    (tgl: string) => {
      const hariItu = diGerai.filter((p) => tgl !== '' && tglLokal(new Date(p.createdAt)) === tgl);
      const masuk = hariItu.filter((p) => p.status !== 'dibatalkan' && (p.lunas || p.status === 'selesai'));
      const perMetode: Record<string, { jumlah: number; total: number }> = {};
      masuk.forEach((p) => {
        const k = labelMetode(p);
        perMetode[k] = perMetode[k] || { jumlah: 0, total: 0 };
        perMetode[k].jumlah += 1;
        perMetode[k].total += p.total;
      });
      const jenis = (t: OrderType) => {
        const l = masuk.filter((p) => p.orderType === t);
        return { jumlah: l.length, total: l.reduce((s, p) => s + p.total, 0) };
      };
      return {
        jumlah: masuk.length,
        total: masuk.reduce((s, p) => s + p.total, 0),
        dineIn: jenis('dine-in'),
        antar: jenis('online'),
        ongkir: masuk.reduce((s, p) => s + p.ongkir, 0),
        perMetode,
        dibatalkan: hariItu.filter((p) => p.status === 'dibatalkan').length,
      };
    },
    [diGerai],
  );
  const rekap = useMemo(() => hitungRekap(hariIni), [hitungRekap, hariIni]);
  const rekapLihat = useMemo(() => hitungRekap(tglRekap), [hitungRekap, tglRekap]);

  const hariRiwayat = useMemo(
    () => diGerai.filter((p) => tglRiwayat !== '' && tglLokal(new Date(p.createdAt)) === tglRiwayat),
    [diGerai, tglRiwayat],
  );
  const listRiwayat = useMemo(
    () =>
      hariRiwayat
        .filter((p) => (filterRiwayat === 'semua' || p.status === filterRiwayat) && cocokCari(p))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [hariRiwayat, filterRiwayat, cocokCari],
  );
  const ringkasRiwayat = useMemo(() => {
    const selesai = hariRiwayat.filter((p) => p.status === 'selesai');
    return {
      semua: hariRiwayat.length,
      selesai: selesai.length,
      dibatalkan: hariRiwayat.filter((p) => p.status === 'dibatalkan').length,
      totalSelesai: selesai.reduce((t, p) => t + p.total, 0),
    };
  }, [hariRiwayat]);

  const jumlahProses = perKolom.pending.length + perKolom.diproses.length;

  const STATUS_LABEL: Record<string, string> = {
    menunggu_bayar: 'Menunggu Bayar',
    pending: 'Antrian',
    diproses: 'Diproses',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
  };

  const renderRiwayat = () => (
    <section className={styles.riwayatPage} aria-label="Riwayat pesanan">
      <div className={styles.riwayatTop}>
        <button type="button" className={styles.btnBack} onClick={() => setRiwayatBuka(false)}>
          <i className="fa-solid fa-arrow-left"></i> Kembali
        </button>
        <div>
          <h2>Riwayat Pesanan</h2>
          <p>
            {gerai === 'semua' ? 'Semua gerai' : namaSingkatGerai(gerai)} · hanya baca
          </p>
        </div>
        <div className={`${styles.searchBox} ${styles.riwayatCari}`}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            placeholder="Cari nama atau nomor pesanan"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.riwayatTools}>
        <PemilihTanggal
          value={tglRiwayat}
          hariIni={hariIni}
          onChange={(t) => setTglRiwayatPilih(t === hariIni ? '' : t)}
          label="Tanggal riwayat"
        />
        <div className={styles.filterRiwayat} role="tablist">
          {(
            [
              ['semua', 'Semua', ringkasRiwayat.semua],
              ['selesai', 'Selesai', ringkasRiwayat.selesai],
              ['dibatalkan', 'Dibatalkan', ringkasRiwayat.dibatalkan],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filterRiwayat === key}
              className={filterRiwayat === key ? styles.filterAktif : ''}
              onClick={() => setFilterRiwayat(key)}
            >
              {label} <b>{n}</b>
            </button>
          ))}
        </div>
      </div>

      <p className={styles.riwayatRingkas}>
        {new Date(`${tglRiwayat}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'full' })} ·{' '}
        {ringkasRiwayat.selesai} selesai senilai <b>{rupiah(ringkasRiwayat.totalSelesai)}</b>
      </p>

      {listRiwayat.length === 0 ? (
        <div className={styles.empty}>
          <i className="fa-solid fa-clock-rotate-left"></i>
          <p>{cari ? 'Tidak ada yang cocok dengan pencarian.' : 'Tidak ada pesanan pada tanggal ini.'}</p>
        </div>
      ) : (
        <div className={styles.riwayatGrid}>
          {listRiwayat.map((p) => (
            <article key={p.id} className={`${styles.card} ${styles.cardArsip} ${styles[`k_${p.status}`] || ''}`}>
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.orderId}>#{p.id}</div>
                  <div className={styles.orderTime}>{jam(p.createdAt)}</div>
                </div>
                <span className={styles.tagSelesai}>{STATUS_LABEL[p.status] || p.status}</span>
              </div>
              <div className={styles.nama}>{p.nama}</div>
              <div className={styles.chips}>
                <span className={styles.chip}>
                  <i className={`fa-solid ${p.orderType === 'online' ? 'fa-motorcycle' : 'fa-utensils'}`}></i>
                  {p.orderType === 'online' ? 'Pesan Antar' : 'Makan di Tempat'}
                </span>
                {gerai === 'semua' && p.gerai && (
                  <span className={styles.chip}>
                    <i className="fa-solid fa-location-dot"></i>
                    {namaSingkatGerai(p.gerai)}
                  </span>
                )}
                <span className={`${styles.chip} ${p.lunas ? styles.chipLunas : ''}`}>
                  <i className={`fa-solid ${p.lunas ? 'fa-circle-check' : 'fa-clock'}`}></i>
                  {labelMetode(p)}
                  {p.lunas ? ' · Lunas' : ''}
                </span>
              </div>
              <ul className={styles.items}>
                {p.items.map((m, i) => (
                  <li key={i}>
                    <span>{m.nama_makanan}</span>
                    <b>x{m.quantity}</b>
                  </li>
                ))}
              </ul>
              <div className={styles.cardBottom}>
                <div className={styles.total}>
                  <small>Total</small>
                  {rupiah(p.total)}
                </div>
                {(p.status === 'selesai' || p.status === 'pending' || p.status === 'diproses') && (
                  <div className={styles.actions}>
                    <button type="button" className={styles.btnReprint} onClick={() => cetakStruk(p)}>
                      <i className="fa-solid fa-print"></i> Cetak Ulang Struk
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  if (!ready) return <div className={styles.page} />;

  if (!loggedIn) {
    return (
      <div className={styles.loginWrap}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <div className={styles.loginIcon}>
            <i className="fa-solid fa-cash-register"></i>
          </div>
          <h1 className={styles.loginTitle}>Kasir Papeda</h1>
          <p className={styles.loginSub}>Masuk untuk mengelola pesanan</p>
          {loginError && <div className={styles.alertError}>{loginError}</div>}
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button type="submit" className={styles.btnPrimary}>
            Masuk
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <i className="fa-solid fa-cash-register"></i>
          <div>
            <div className={styles.brandTitle}>Kasir Papeda</div>
            <div className={styles.brandSub}>{diperbarui ? `Diperbarui ${diperbarui}` : 'Memuat…'}</div>
          </div>
        </div>

        <div className={styles.geraiBox} ref={geraiRef}>
          <button
            type="button"
            className={`${styles.geraiTrigger} ${geraiBuka ? styles.geraiTriggerBuka : ''}`}
            onClick={() => setGeraiBuka((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={geraiBuka}
            aria-label="Gerai kasir"
          >
            <i className="fa-solid fa-store"></i>
            <span className={styles.geraiNama}>{gerai ? namaSingkatGerai(gerai) : 'Pilih gerai'}</span>
            <i className={`fa-solid fa-chevron-down ${styles.geraiChevron}`}></i>
          </button>

          {geraiBuka && (
            <ul className={styles.geraiMenu} role="listbox" aria-label="Daftar gerai">
              {(daftarGerai.includes(gerai) ? daftarGerai : [gerai, ...daftarGerai])
                .filter(Boolean)
                .map((g) => {
                  const aktif = g === gerai;
                  return (
                    <li key={g} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={aktif}
                        aria-disabled={!aktif}
                        className={`${styles.geraiOpsi} ${aktif ? styles.geraiOpsiAktif : styles.geraiOpsiKunci}`}
                        onClick={() => {
                          if (!aktif) return;
                          setGerai(g);
                          setGeraiBuka(false);
                        }}
                      >
                        <i className={`fa-solid ${aktif ? 'fa-store' : 'fa-lock'}`}></i>
                        <span>{namaSingkatGerai(g)}</span>
                        {aktif && <i className={`fa-solid fa-check ${styles.geraiCek}`}></i>}
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <small>Menunggu bayar</small>
            <b>{perKolom.menunggu_bayar.length}</b>
          </div>
          <div className={styles.stat}>
            <small>Dalam proses</small>
            <b>{jumlahProses}</b>
          </div>
          <div className={styles.stat}>
            <small>Diterima hari ini</small>
            <b>{rupiah(rekap.total)}</b>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={toggleSuara}
            title={suara ? 'Bunyi pesanan baru: aktif' : 'Bunyi pesanan baru: mati'}
            aria-pressed={suara}
          >
            <i className={`fa-solid ${suara ? 'fa-bell' : 'fa-bell-slash'}`}></i>
          </button>
          <button type="button" className={styles.btnGhost} onClick={() => setRekapBuka(true)} title="Rekap harian">
            <i className="fa-solid fa-clipboard-list"></i>
            <span className={styles.hideSm}> Rekap</span>
          </button>
          <button type="button" className={styles.btnGhost} onClick={muat} title="Muat ulang">
            <i className="fa-solid fa-rotate"></i>
          </button>
          <button type="button" className={styles.btnGhost} onClick={handleLogout} title="Keluar">
            <i className="fa-solid fa-right-from-bracket"></i>
            <span className={styles.hideSm}> Keluar</span>
          </button>
        </div>
      </header>

      {!riwayatBuka && (
        <div className={styles.subbar}>
          <div className={styles.searchBox}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              placeholder="Cari nama atau nomor pesanan"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
            />
          </div>
        </div>
      )}

      {baruDibayar && (
        <div className={styles.alertSuccess}>
          <span>
            <i className="fa-solid fa-circle-check"></i> Pembayaran <b>#{baruDibayar.id}</b> ({baruDibayar.nama},{' '}
            {rupiah(baruDibayar.total)}) diterima dan masuk antrian.
          </span>
          <span className={styles.alertActions}>
            <button type="button" className={styles.btnSmall} onClick={() => cetakStruk(baruDibayar)}>
              <i className="fa-solid fa-print"></i> Cetak Struk
            </button>
            <button type="button" className={styles.btnClose} onClick={() => setBaruDibayar(null)} aria-label="Tutup">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </span>
        </div>
      )}

      {errorMsg && (
        <div className={styles.alertError}>
          <i className="fa-solid fa-triangle-exclamation"></i> {errorMsg}
        </div>
      )}

      {riwayatBuka ? (
        renderRiwayat()
      ) : (
        <>
      <nav className={styles.mobileTabs} aria-label="Status pesanan">
        {KOLOM.map((k) => (
          <button
            key={k.key}
            type="button"
            className={`${styles.mTab} ${styles[`k_${k.key}`]} ${kolomAktif === k.key ? styles.mTabAktif : ''}`}
            onClick={() => setKolomAktif(k.key)}
          >
            <i className={`fa-solid ${k.icon}`}></i>
            <span>{k.label}</span>
            <b>{perKolom[k.key].length}</b>
          </button>
        ))}
      </nav>

      <main className={styles.board}>
        {KOLOM.map((k) => {
          const list = perKolom[k.key];
          return (
            <section
              key={k.key}
              className={`${styles.col} ${styles[`k_${k.key}`]} ${kolomAktif === k.key ? styles.colAktif : ''}`}
            >
              <div className={styles.colHead}>
                <span>
                  <i className={`fa-solid ${k.icon}`}></i> {k.label}
                </span>
                <b className={styles.colCount}>{list.length}</b>
              </div>

              {k.key === 'selesai' && (
                <div className={styles.riwayat}>
                  <div className={styles.riwayatInfo}>
                    <span>
                      <b>{list.length}</b> pesanan hari ini
                      {!cari && <> · {rupiah(list.reduce((t, p) => t + p.total, 0))}</>}
                    </span>
                  </div>
                  <button type="button" className={styles.btnRiwayat} onClick={() => setRiwayatBuka(true)}>
                    <i className="fa-solid fa-clock-rotate-left"></i> Riwayat pesanan
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              )}

              <div className={styles.colBody}>
                {memuat ? (
                  <div className={styles.empty}>Memuat pesanan…</div>
                ) : list.length === 0 ? (
                  <div className={styles.empty}>
                    <i className={`fa-solid ${k.icon}`}></i>
                    <p>
                      {cari
                        ? 'Tidak ada yang cocok dengan pencarian.'
                        : k.kosong}
                    </p>
                  </div>
                ) : (
                  list.map((p) => {
                    const menit = now ? Math.max(0, Math.floor((now - new Date(p.createdAt).getTime()) / 60000)) : 0;
                    const sisa = Math.max(0, BATAS_BAYAR_MENIT - menit);
                    const persen = Math.min(100, (sisa / BATAS_BAYAR_MENIT) * 100);
                    const hampirHabis = k.key === 'menunggu_bayar' && sisa <= 5;
                    const lama = (k.key === 'pending' || k.key === 'diproses') && menit >= BATAS_LAMA_MENIT;
                    const sibuk = sibukId === p.id;
                    const sedangKonfirmasi = konfirmasiId === p.id;
                    const baru = baruIds.includes(p.id);
                    return (
                      <article
                        key={p.id}
                        className={`${styles.card} ${k.key === 'selesai' ? styles.cardArsip : ''} ${hampirHabis || lama ? styles.cardPeringatan : ''} ${baru ? styles.cardBaru : ''}`}
                      >
                        <div className={styles.cardTop}>
                          <div>
                            <div className={styles.orderId}>#{p.id}</div>
                            <div className={styles.orderTime}>
                              {jam(p.createdAt)}
                              {k.key !== 'selesai' && (
                                <span className={lama ? styles.merah : ''}> · {menit} mnt lalu</span>
                              )}
                            </div>
                          </div>
                          {baru && <span className={styles.tagBaru}>BARU</span>}
                          {k.key === 'selesai' && (
                            <span className={styles.tagSelesai}>
                              <i className="fa-solid fa-circle-check"></i> Selesai
                            </span>
                          )}
                        </div>

                        <div className={styles.nama}>{p.nama}</div>
                        <div className={styles.chips}>
                          <span className={styles.chip}>
                            <i className={`fa-solid ${p.orderType === 'online' ? 'fa-motorcycle' : 'fa-utensils'}`}></i>
                            {p.orderType === 'online' ? 'Pesan Antar' : 'Makan di Tempat'}
                          </span>
                          {gerai === 'semua' && p.gerai && (
                            <span className={styles.chip}>
                              <i className="fa-solid fa-location-dot"></i>
                              {namaSingkatGerai(p.gerai)}
                            </span>
                          )}
                          <span className={`${styles.chip} ${p.lunas ? styles.chipLunas : ''}`}>
                            <i className={`fa-solid ${p.lunas ? 'fa-circle-check' : 'fa-clock'}`}></i>
                            {labelMetode(p)}
                            {p.lunas ? ' · Lunas' : p.cod ? ' · Bayar ke kurir' : ''}
                          </span>
                        </div>
                        {p.alamat && (
                          <div className={styles.alamat}>
                            <i className="fa-solid fa-map-pin"></i> {p.alamat}
                          </div>
                        )}

                        <ul className={styles.items}>
                          {p.items.map((m, i) => (
                            <li key={i}>
                              <span>{m.nama_makanan}</span>
                              <b>x{m.quantity}</b>
                            </li>
                          ))}
                        </ul>

                        {k.key === 'menunggu_bayar' && (
                          <div className={styles.timer} title={`Dibatalkan otomatis setelah ${BATAS_BAYAR_MENIT} menit`}>
                            <div className={styles.timerBar}>
                              <span
                                className={hampirHabis ? styles.timerHabis : ''}
                                style={{ width: `${persen}%` }}
                              ></span>
                            </div>
                            <small className={hampirHabis ? styles.merah : ''}>
                              Sisa {sisa} mnt sebelum dibatalkan otomatis
                            </small>
                          </div>
                        )}

                        <div className={styles.cardBottom}>
                          <div className={styles.total}>
                            <small>Total</small>
                            {rupiah(p.total)}
                          </div>
                          <div className={styles.actions}>
                            {k.key === 'menunggu_bayar' && (
                              <>
                                <button
                                  type="button"
                                  className={sedangKonfirmasi ? styles.btnConfirm : styles.btnPay}
                                  disabled={sibuk}
                                  onClick={() => jalankan(p, 'bayar')}
                                >
                                  {sibuk ? 'Memproses…' : sedangKonfirmasi ? `Ya, terima ${rupiah(p.total)}` : 'Terima Pembayaran'}
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnCancel}
                                  disabled={sibuk}
                                  title="Batalkan pesanan"
                                  onClick={() => jalankan(p, 'batal')}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </>
                            )}
                            {k.key === 'pending' && (
                              <button type="button" className={styles.btnProses} disabled={sibuk} onClick={() => jalankan(p, 'proses')}>
                                {sibuk ? 'Memproses…' : 'Proses'}
                              </button>
                            )}
                            {k.key === 'diproses' && (
                              <button type="button" className={styles.btnSelesai} disabled={sibuk} onClick={() => jalankan(p, 'selesai')}>
                                {sibuk ? 'Memproses…' : 'Selesai'}
                              </button>
                            )}
                            {k.key === 'selesai' && (
                              <button type="button" className={styles.btnReprint} onClick={() => cetakStruk(p)}>
                                <i className="fa-solid fa-print"></i> Cetak Ulang Struk
                              </button>
                            )}
                            {(k.key === 'pending' || k.key === 'diproses') && (
                              <button
                                type="button"
                                className={styles.btnIcon}
                                title="Cetak struk"
                                onClick={() => cetakStruk(p)}
                              >
                                <i className="fa-solid fa-print"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </main>
        </>
      )}

      {rekapBuka && (
        <div className={styles.overlay} onClick={() => setRekapBuka(false)} role="presentation">
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Rekap harian"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2>Rekap Harian</h2>
              <button type="button" className={styles.btnClose} onClick={() => setRekapBuka(false)} aria-label="Tutup">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <p className={styles.modalSub}>
              {gerai === 'semua' ? 'Semua gerai' : namaSingkatGerai(gerai)} ·{' '}
              {tglRekap
                ? new Date(`${tglRekap}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'full' })
                : ''}
            </p>

            <PemilihTanggal
              value={tglRekap}
              hariIni={hariIni}
              onChange={(t) => setTglRekapPilih(t === hariIni ? '' : t)}
              label="Tanggal rekap"
            />

            <div className={styles.rekapMetode}>
              {(
                [
                  ['Bayar di Kasir', 'Uang di laci', 'fa-box-archive', styles.mLaci],
                  ['COD', 'COD', 'fa-motorcycle', styles.mCod],
                  ['E-Wallet', 'E-Wallet', 'fa-mobile-screen', styles.mEwallet],
                ] as const
              ).map(([kunci, judul, ikon, kelas]) => (
                <div key={kunci} className={`${styles.metodeTile} ${kelas}`}>
                  <small>
                    <i className={`fa-solid ${ikon}`}></i> {judul}
                  </small>
                  <b>{rupiah(rekapLihat.perMetode[kunci]?.total || 0)}</b>
                  <span>{rekapLihat.perMetode[kunci]?.jumlah || 0} transaksi</span>
                </div>
              ))}
            </div>

            <div className={styles.rekapTotal}>
              <small>Total uang diterima</small>
              <b>{rupiah(rekapLihat.total)}</b>
              <span>{rekapLihat.jumlah} transaksi</span>
            </div>

            <div className={styles.jenisBox}>
              <h3>Jenis pesanan</h3>
              <div className={styles.jenisRow}>
                <span>
                  <i className="fa-solid fa-utensils"></i> Makan di Tempat
                </span>
                <em>{rekapLihat.dineIn.jumlah} transaksi</em>
                <b>{rupiah(rekapLihat.dineIn.total)}</b>
              </div>
              <div className={styles.jenisRow}>
                <span>
                  <i className="fa-solid fa-motorcycle"></i> Pesan Antar
                </span>
                <em>{rekapLihat.antar.jumlah} transaksi</em>
                <b>{rupiah(rekapLihat.antar.total)}</b>
              </div>
              <div className={`${styles.jenisRow} ${styles.jenisOngkir}`}>
                <span>
                  <i className="fa-solid fa-route"></i> Ongkos kirim (sudah termasuk di Pesan Antar)
                </span>
                <b>{rupiah(rekapLihat.ongkir)}</b>
              </div>
            </div>

            <p className={styles.modalNote}>
              Pesanan dibatalkan: {rekapLihat.dibatalkan}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
