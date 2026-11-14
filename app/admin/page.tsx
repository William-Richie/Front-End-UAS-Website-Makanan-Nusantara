'use client';

import './admin-global.css';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BarChart, StatusBars, singkat } from '@/components/Admin/Beranda/AdminCharts';
import { HalamanPreview, OrbitPreview } from '@/components/Admin/Preview/SitePreview';
import type { BranchMap } from '@/components/User/Reservation/ReservationSection';
import type { FavoriteItem } from '@/components/User/Orbit/OrbitCarousel';
import {
  BENTUK_ORBIT,
  GERAK_ORBIT,
  KECEPATAN_ORBIT,
  MODE_ORBIT,
  ORBIT_DEFAULT,
  PALET_ORBIT,
  rapikanOrbit,
  type OrbitSetting,
} from '@/lib/orbit';

// Definisikan Interface TypeScript lengkap untuk membasmi 'any'
export interface MenuItem {
  id: number;
  nama_kategori: string;
  nama_makanan: string;
  harga: number;
  gambar: string;
  pedas: number;
  status: boolean;
  deskripsi: string | null;
}

export interface PesananItem {
  id: number;
  nama: string;
  item: string;
  total: number;
  status: string;
  created_at: string;
}

export interface FaqItem {
  id: number;
  pertanyaan: string;
  jawaban: string;
}

export interface FaqPertanyaanItem {
  id: number;
  nama: string;
  email: string;
  pertanyaan: string;
  dibaca: boolean;
  created_at: string;
}

export interface ReservasiItem {
  id: string;
  nama: string;
  gerai: string;
  telepon: string;
  tanggal: string;
  jam: string;
  jumlah: number;
  ruangan: string;
  status: string;
  catatan?: string | null;
  email?: string | null;
  sesi?: string | null;
}

export interface UserItem {
  id: string | number;
  nama: string | null;
  email: string | null;
  created_at: string | null;
  total_reserve?: number | string | null;
  Is_Active?: boolean | string | number | null;
  is_active?: boolean | string | number | null;
}
interface InfoRuangan {
  ruangan: string;
  label: string;
  grup: 'Reguler' | 'VIP Room';
  jumlah: number | null;
  terpakai: number;
  sisa: number | null;
  status: boolean;
  tersedia: boolean;
}

type ReservasiTabKey = 'user' | 'pending' | 'approved' | 'complete' | 'dibatalkan';
type UserFilter = '' | 'active' | 'blocked';
type UserAksi = '' | 'modifikasi' | 'blokir' | 'hapus';

interface ConfirmState {
  title: string;
  message: string;
  buttonText: string;
  danger: boolean;
  icon: string;
  onConfirm: () => void;
}

const isUserActive = (u: UserItem): boolean => {
  const raw = u.Is_Active !== undefined ? u.Is_Active : u.is_active;
  return !(raw === false || raw === 'false' || raw === 0);
};

const statusMatch = (status: string, tab: ReservasiTabKey): boolean => {
  if (tab === 'approved') return status === 'approved' || status === 'dikonfirmasi';
  if (tab === 'complete') return status === 'complete' || status === 'selesai';
  if (tab === 'dibatalkan') return status === 'dibatalkan' || status === 'cancelled';
  return status === tab;
};

const statusRoomInfo = (r: InfoRuangan): string => {
  if (!r.status) return 'Dalam Perbaikan';
  if (r.grup === 'VIP Room') return r.terpakai > 0 ? 'Dipesan' : '';
  return r.sisa === 0 ? 'Penuh' : '';
};

const cocokSearch = (data: object, keyword: string): boolean => {
  if (!keyword) return true;
  const k = keyword.toLowerCase().trim();
  return Object.values(data).some((v) => String(v ?? '').toLowerCase().includes(k));
};

const adminFetch = (url: string, opts: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('papeda_admin_token') : null;
  const headers: Record<string, string> = { ...((opts.headers as Record<string, string>) || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
};

const ambilJson = (url: string) => fetch(url).then((r) => r.json()).catch(() => null);

const ambilDaftar = <T,>(url: string): Promise<T[]> =>
  ambilJson(url).then((d: { data?: unknown } | null) => (Array.isArray(d?.data) ? (d.data as T[]) : []));

// Menu di halaman Kelola: tiap tombol punya bagian di preview yang ikut digulir
const KELOLA_MENU = [
  { key: 'home', label: 'Home & About', icon: 'fa-house', target: '#home' },
  { key: 'faq', label: 'FAQ', icon: 'fa-circle-question', target: '#faq' },
  { key: 'lokasi', label: 'Lokasi', icon: 'fa-location-dot', target: '#location' },
  { key: 'footer', label: 'Footer', icon: 'fa-shoe-prints', target: 'footer' },
] as const;

type KelolaKey = (typeof KELOLA_MENU)[number]['key'];

const RESERVASI_MENU = [
  { key: 'reservasi', label: 'Reservasi', icon: 'fa-calendar-check' },
  { key: 'ruangan', label: 'Ruangan', icon: 'fa-door-open' },
] as const;

type ReservasiMenuKey = (typeof RESERVASI_MENU)[number]['key'];

// Tab di halaman Kelola Menu Favorit
const ORBIT_TAB = [
  { key: 'menu', label: 'Menu', icon: 'fa-utensils' },
  { key: 'gerak', label: 'Gerakan', icon: 'fa-rotate' },
  { key: 'bentuk', label: 'Bentuk & Warna', icon: 'fa-shapes' },
] as const;

type OrbitTabKey = (typeof ORBIT_TAB)[number]['key'];

export interface StatistikData {
  id: number;
  jumlah_pengunjung: number;
}

export interface FavoritSlot {
  slot: number;
  menu_id: number | null;
  nama_makanan: string | null;
  gambar: string | null;
  deskripsi?: string | null;
  pedas?: number;
}

export interface FooterData {
  id?: number;
  judul: string;
  copyright: string;
  link_ig: string;
  link_tiktok: string;
  link_wa: string;
  email: string;
  link_linkedin: string;
}

export interface KontenWebData {
  id?: number;
  hero_eyebrow?: string;
  teks_hero?: string;
  hero_sub?: string;
  about_eyebrow?: string;
  about_title?: string;
  teks_about?: string;
  card1_title?: string;
  card1_desc?: string;
  card2_title?: string;
  card2_desc?: string;
  card3_title?: string;
  card3_desc?: string;
}

export interface PendapatanSummary {
  ringkasan: {
    total: number;
    pesanan: number;
    item: number;
    rata: number;
  };
  grafik: { label: string; total: number }[];
  terlaris: { nama: string; qty: number; pendapatan: number }[];
  laporan: { tanggal: string; pesanan: number; item: number; pendapatan: number }[];
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'statistik' | 'menu' | 'favorit' | 'konten' | 'pesanan' | 'reservasi' | 'pendapatan'
  >('statistik');

  // Typed Data States
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [pesananList, setPesananList] = useState<PesananItem[]>([]);
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [pertanyaanList, setPertanyaanList] = useState<FaqPertanyaanItem[]>([]);
  const [reservasiList, setReservasiList] = useState<ReservasiItem[]>([]);
  const [statistik, setStatistik] = useState<StatistikData | null>(null);
  const [favoritList, setFavoritList] = useState<FavoritSlot[]>([]);
  const [favoritTerlaris, setFavoritTerlaris] = useState<FavoritSlot[]>([]);
  const [orbitSetting, setOrbitSetting] = useState<OrbitSetting>(ORBIT_DEFAULT);
  const [branches, setBranches] = useState<BranchMap[]>([]);
  const [newBranch, setNewBranch] = useState({ nama: '', alamat: '', latitude: '', longitude: '' });
  const [kelolaTab, setKelolaTab] = useState<KelolaKey>('home');
  const [orbitTab, setOrbitTab] = useState<OrbitTabKey>('menu');
  const previewRef = useRef<HTMLDivElement>(null);
  const [footerData, setFooterData] = useState<FooterData>({
    judul: 'Ikuti Kami',
    copyright: '© 2026 Papeda Restaurant. All Rights Reserved.',
    link_ig: '',
    link_tiktok: '',
    link_wa: '',
    email: '',
    link_linkedin: '',
  });

  // Konten Web State (Dengan Live Preview)
  const [kontenWeb, setKontenWeb] = useState<KontenWebData>({
    hero_eyebrow: 'Cita Rasa Timur Indonesia',
    teks_hero: 'Welcome to Our\nPapeda Restaurant',
    hero_sub: 'Cita rasa asli Timur Indonesia, dari sagu hingga kuah kuning.',
    about_eyebrow: 'Tentang Kami',
    about_title: 'Warisan Rasa dari Timur',
    teks_about: 'Selamat datang di Papeda Restaurant, tempat terbaik untuk menikmati hidangan khas Nusantara Timur. Kami menyajikan berbagai menu tradisional dengan cita rasa otentik yang akan memanjakan lidah Anda.',
    card1_title: 'Bahan Segar',
    card1_desc: 'Sagu dan hasil laut dipilih segar setiap hari.',
    card2_title: 'Resep Turun-temurun',
    card2_desc: 'Resep rahasia yang menjaga keaslian rasa.',
    card3_title: 'Disajikan Sepenuh Hati',
    card3_desc: 'Suasana hangat ala rumah, cocok untuk keluarga.',
  });

  // Reservasi & User (port dari Node.js)
  const [reservasiAdmin, setReservasiAdmin] = useState<ReservasiItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [reservasiTab, setReservasiTab] = useState<ReservasiTabKey>('user');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [userFilter, setUserFilter] = useState<UserFilter>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userAksi, setUserAksi] = useState<UserAksi>('');
  const [ruanganGerai, setRuanganGerai] = useState<string>('');
  const [ruanganTanggal, setRuanganTanggal] = useState<string>('');
  const [ruanganSesi, setRuanganSesi] = useState<string>('morning');
  const [ruanganList, setRuanganList] = useState<InfoRuangan[]>([]);
  const [ruanganPesan, setRuanganPesan] = useState<string>('');
  const [reservasiMenu, setReservasiMenu] = useState<ReservasiMenuKey>('reservasi');
  const [aksiOpen, setAksiOpen] = useState<boolean>(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const [pendapatanData, setPendapatanData] = useState<PendapatanSummary | null>(null);
  const [pendapatanRange, setPendapatanRange] = useState<string>('7');
  const [tanggalSekarang, setTanggalSekarang] = useState<Date | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setRuanganTanggal(new Date().toLocaleDateString('en-CA')), 0);
    return () => clearTimeout(t);
  }, []);

  // Form Tambah Menu State
  const [newMenu, setNewMenu] = useState<{
    nama_kategori: string;
    nama_makanan: string;
    harga: number;
    gambar: string;
    pedas: number;
    status: boolean;
    deskripsi: string;
  }>({
    nama_kategori: 'MAIN COURSE',
    nama_makanan: '',
    harga: 0,
    gambar: '/img/papeda-icon.png',
    pedas: 0,
    status: true,
    deskripsi: '',
  });

  // Cek Ruangan Reservasi
  const loadRuangan = async () => {
    if (!ruanganGerai || !ruanganTanggal) {
      setRuanganList([]);
      return;
    }
    try {
      const p = new URLSearchParams({ gerai: ruanganGerai, tanggal: ruanganTanggal, sesi: ruanganSesi });
      const res = await adminFetch(`/api/admin/ruangan?${p}`);
      const json = await res.json().catch(() => ({}));
      setRuanganList(json.data || []);
    } catch (e) {
      console.error('Gagal mengambil data ruangan:', e);
    }
  };

  useEffect(() => {
    if (!ruanganGerai && branches.length > 0) setRuanganGerai(branches[0].nama);
  }, [branches, ruanganGerai]);

  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'reservasi' || reservasiMenu !== 'ruangan') return;
      loadRuangan();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, activeTab, reservasiMenu, ruanganGerai, ruanganTanggal, ruanganSesi]);

  const kirimRuangan = async (body: object) => {
    try {
      const res = await adminFetch('/api/admin/ruangan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gerai: ruanganGerai, ...body }),
      });
      const json = await res.json().catch(() => ({}));
      setRuanganPesan(res.ok ? 'Tersimpan.' : json.error || 'Gagal menyimpan.');
    } catch {
      setRuanganPesan('Gagal menyimpan.');
    }
    loadRuangan();
  };

  const ubahJumlahRuangan = (r: InfoRuangan, n: number) => {
    if (!Number.isInteger(n) || n < 0 || n > 50) return;
    kirimRuangan({ ruangan: r.ruangan, jumlah: n });
  };

  const toggleStatusRuangan = (r: InfoRuangan) => kirimRuangan({ ruangan: r.ruangan, status: !r.status });

  // id menu yang sedang diedit (null = form dipakai untuk menambah menu baru)
  const [editMenuId, setEditMenuId] = useState<number | null>(null);

  // Form FAQ
  const [newFaq, setNewFaq] = useState<{ pertanyaan: string; jawaban: string }>({
    pertanyaan: '',
    jawaban: '',
  });

  // kolom item di database bisa berupa JSON keranjang atau teks biasa
  const ringkasItem = (raw: string): string => {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p?.daftar_menu)) {
        return p.daftar_menu
          .map((m: { nama_makanan: string; quantity?: number }) => `${m.nama_makanan} x${m.quantity || 1}`)
          .join(', ');
      }
    } catch {
      // bukan JSON, tampilkan apa adanya
    }
    return raw;
  };

  const STATUS_PESANAN: Record<string, string> = {
    pending: 'bg-warning text-dark',
    diproses: 'bg-primary',
    selesai: 'bg-success',
  };

  // Cek sesi login admin
  useEffect(() => {
    // sesi lama yang tersimpan permanen di localStorage dibuang, login admin hanya berlaku selama tab terbuka
    localStorage.removeItem('papeda_admin_logged');
    const adminSession = sessionStorage.getItem('papeda_admin_logged');
    if (adminSession === 'true') {
      const timer = setTimeout(() => setIsLoggedIn(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Reload sebagian data saja, supaya isian form yang belum disimpan tidak ikut ter-reset
  const loadFavorit = () => {
    ambilDaftar<FavoritSlot>('/api/favorit?sumber=manual').then(setFavoritList);
    ambilDaftar<FavoritSlot>('/api/favorit?sumber=terlaris').then(setFavoritTerlaris);
  };
  const loadFaq = () => ambilDaftar<FaqItem>('/api/faq').then(setFaqList);
  const loadBranches = () => ambilDaftar<BranchMap>('/api/maps').then(setBranches);

  const loadAllData = async () => {
    const ambil = (url: string) => fetch(url).then((r) => r.json()).catch(() => null);
    const daftar = <T,>(d: { data?: unknown } | null): T[] => (Array.isArray(d?.data) ? (d.data as T[]) : []);
    const objek = <T extends object>(d: { data?: unknown } | null): Partial<T> => {
      const v = d && 'data' in d ? d.data : d;
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Partial<T>) : {};
    };
    const tanpaNull = <T extends object>(o: Partial<T>) =>
      Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as Partial<T>;

    ambil('/api/menu').then((d) => setMenus(daftar<MenuItem>(d)));
    ambil('/api/pesanan').then((d) => setPesananList(daftar<PesananItem>(d)));
    ambil('/api/faq').then((d) => setFaqList(daftar<FaqItem>(d)));
    ambil('/api/faq/pertanyaan').then((d) => setPertanyaanList(daftar<FaqPertanyaanItem>(d)));
    ambil('/api/reservasi').then((d) => setReservasiList(daftar<ReservasiItem>(d)));
    loadFavorit();
    loadBranches();
    ambil('/api/orbit').then((d) => setOrbitSetting(rapikanOrbit(objek<OrbitSetting>(d))));
    ambil('/api/pengunjung').then((d) => {
      const s = objek<StatistikData>(d);
      setStatistik(typeof s.jumlah_pengunjung === 'number' ? (s as StatistikData) : null);
    });
    ambil('/api/konten').then((d) => setKontenWeb((prev) => ({ ...prev, ...tanpaNull<KontenWebData>(objek<KontenWebData>(d)) })));
    ambil('/api/footer').then((d) => setFooterData((prev) => ({ ...prev, ...tanpaNull<FooterData>(objek<FooterData>(d)) })));
    ambil(`/api/pendapatan?range=${pendapatanRange}`).then((d) => setPendapatanData(d?.ringkasan ? d : null));
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, pendapatanRange]);

  // Preview di halaman Kelola menggulir ke bagian yang sedang diedit
  useEffect(() => {
    if (activeTab !== 'konten') return;
    const box = previewRef.current;
    const tujuan = KELOLA_MENU.find((m) => m.key === kelolaTab)?.target;
    const el = box && tujuan ? box.querySelector<HTMLElement>(tujuan) : null;
    if (!box || !el) return;
    box.scrollTo({
      top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top,
      behavior: 'smooth',
    });
  }, [kelolaTab, activeTab]);

  const loadUsers = async () => {
    try {
      const res = await adminFetch('/api/admin/users');
      const json = await res.json();
      setUsersList(json.data || []);
    } catch (e) {
      console.error('Gagal mengambil data user:', e);
    }
  };

  const loadReservasiAdmin = async () => {
    try {
      const res = await adminFetch('/api/admin/reservasi');
      const json = await res.json();
      setReservasiAdmin(json.data || []);
    } catch (e) {
      console.error('Gagal mengambil data reservasi:', e);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || activeTab !== 'reservasi') return;
    adminFetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsersList(d.data || []))
      .catch((e) => console.error('Gagal mengambil data user:', e));
    adminFetch('/api/admin/reservasi')
      .then((r) => r.json())
      .then((d) => setReservasiAdmin(d.data || []))
      .catch((e) => console.error('Gagal mengambil data reservasi:', e));
  }, [isLoggedIn, activeTab]);

  const bukaConfirm = (c: Omit<ConfirmState, 'danger' | 'icon'> & { danger?: boolean; icon?: string }) =>
    setConfirmState({ danger: false, icon: '?', ...c });

  const handleUbahStatusReservasi = (id: string, next: 'approved' | 'complete' | 'dibatalkan') => {
    const cfg = {
      approved: { title: 'Konfirmasi Reservasi?', message: 'Apakah kamu yakin ingin mengonfirmasi reservasi ini?', buttonText: 'Ya, Konfirmasi', danger: false, icon: '?' },
      complete: { title: 'Selesaikan Reservasi?', message: 'Apakah kamu yakin reservasi ini sudah selesai?', buttonText: 'Ya, Selesaikan', danger: false, icon: '?' },
      dibatalkan: { title: 'Batalkan Reservasi?', message: 'Apakah kamu yakin ingin membatalkan reservasi ini?', buttonText: 'Ya, Batalkan', danger: true, icon: '!' },
    }[next];

    bukaConfirm({
      ...cfg,
      onConfirm: async () => {
        try {
          const res = await adminFetch(`/api/admin/reservasi/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: next }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.message || 'Gagal memperbarui status reservasi');
          await loadReservasiAdmin();
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Gagal memperbarui status reservasi');
        }
      },
    });
  };

  const handleEksekusiAksiUser = () => {
    if (!userAksi || selectedUsers.length === 0) {
      alert('Pilih aksi dan minimal 1 akun!');
      return;
    }
    const ids = [...selectedUsers];
    const pesan =
      userAksi === 'hapus'
        ? `Yakin ingin menghapus permanen ${ids.length} akun ini?`
        : userAksi === 'blokir'
        ? `Blokir ${ids.length} akun terpilih? Mereka tidak akan bisa login.`
        : `Ubah status ${ids.length} akun menjadi Active (Buka Blokir)?`;

    bukaConfirm({
      title: 'Konfirmasi',
      message: pesan,
      buttonText: 'Lanjutkan',
      danger: userAksi === 'hapus' || userAksi === 'blokir',
      icon: '?',
      onConfirm: async () => {
        try {
          if (userAksi === 'hapus') {
            const res = await adminFetch('/api/admin/users', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids }),
            });
            if (!res.ok) throw new Error('Gagal menghapus di database');
            setUsersList((prev) => prev.filter((u) => !ids.includes(String(u.id))));
          } else {
            const target = userAksi === 'modifikasi';
            const res = await adminFetch('/api/admin/users/status', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids, Is_Active: target }),
            });
            if (!res.ok) throw new Error('Gagal memperbarui status di database');
            setUsersList((prev) =>
              prev.map((u) => (ids.includes(String(u.id)) ? { ...u, Is_Active: target } : u))
            );
          }
          setUserAksi('');
          setSelectedUsers([]);
        } catch (err) {
          console.error(err);
          alert('Gagal menyimpan perubahan ke database.');
        }
      },
    });
  };

  const toggleFilterUser = () =>
    setUserFilter((f) => (f === '' ? 'active' : f === 'active' ? 'blocked' : ''));

  const filteredUsers = usersList.filter((u) => {
    const aktif = isUserActive(u);
    if (userFilter === 'active' && !aktif) return false;
    if (userFilter === 'blocked' && aktif) return false;
    return cocokSearch(u, globalSearch);
  });

  const filteredReservasi =
    reservasiTab === 'user'
      ? []
      : reservasiAdmin.filter((r) => statusMatch(r.status, reservasiTab) && cocokSearch(r, globalSearch));

  const countReservasi = (tab: ReservasiTabKey) => reservasiAdmin.filter((r) => statusMatch(r.status, tab)).length;

  const allUsersChecked =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedUsers.includes(String(u.id)));

  const toggleUserCheck = (id: string) =>
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleCheckAll = () =>
    setSelectedUsers(allUsersChecked ? [] : filteredUsers.map((u) => String(u.id)));

  const AKSI_LABEL: Record<UserAksi, string> = {
    '': 'Pilih Aksi',
    modifikasi: '✏️ Modifikasi Akun',
    blokir: '🚫 Blokir Akun',
    hapus: '🗑️ Hapus Akun',
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('papeda_admin_logged', 'true');
      setIsLoggedIn(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Username atau password admin salah (default: admin / admin123)');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('papeda_admin_logged');
    localStorage.removeItem('papeda_admin_logged');
    setIsLoggedIn(false);
  };

  // Menu Handlers
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const sedangEdit = editMenuId !== null;
    try {
      const res = await fetch(sedangEdit ? `/api/menu/${editMenuId}` : '/api/menu', {
        method: sedangEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenu),
      });
      if (res.ok) {
        alert(sedangEdit ? 'Menu berhasil diperbarui!' : 'Menu berhasil ditambahkan!');
        setEditMenuId(null);
        setNewMenu({
          nama_kategori: 'MAIN COURSE',
          nama_makanan: '',
          harga: 0,
          gambar: '/img/papeda-icon.png',
          pedas: 0,
          status: true,
          deskripsi: '',
        });
        loadAllData();
      } else {
        alert('Gagal menyimpan menu');
      }
    } catch {
      alert('Gagal menyimpan menu');
    }
  };

  const resetFormMenu = () => {
    setEditMenuId(null);
    setNewMenu({
      nama_kategori: 'MAIN COURSE',
      nama_makanan: '',
      harga: 0,
      gambar: '/img/papeda-icon.png',
      pedas: 0,
      status: true,
      deskripsi: '',
    });
  };

  // isi form dengan data menu yang dipilih, lalu gulir ke form
  const handleEditMenu = (m: MenuItem) => {
    setEditMenuId(m.id);
    setNewMenu({
      nama_kategori: m.nama_kategori,
      nama_makanan: m.nama_makanan,
      harga: m.harga,
      gambar: m.gambar,
      pedas: m.pedas,
      status: m.status,
      deskripsi: m.deskripsi ?? '',
    });
    document.getElementById('form-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Hapus menu ini?')) return;
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (editMenuId === id) resetFormMenu();
      loadAllData();
    } catch {
      alert('Gagal menghapus menu');
    }
  };

  const handleToggleMenuStatus = async (item: MenuItem) => {
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: !item.status }),
      });
      loadAllData();
    } catch {
      alert('Gagal update status menu');
    }
  };

  // Kelola Favorit Slot (1 - 5)
  const handleSaveFavorit = async (slot: number, menuId: number) => {
    try {
      const selectedItem = menus.find((m) => m.id === menuId);
      const updatedData = [...favoritList];
      const idx = updatedData.findIndex((f) => f.slot === slot);
      if (idx !== -1) {
        updatedData[idx].menu_id = menuId;
        updatedData[idx].nama_makanan = selectedItem?.nama_makanan || '';
        updatedData[idx].gambar = selectedItem?.gambar || '';
      } else {
        updatedData.push({
          slot,
          menu_id: menuId,
          nama_makanan: selectedItem?.nama_makanan || '',
          gambar: selectedItem?.gambar || '',
        });
      }

      setFavoritList(updatedData);

      const res = await fetch('/api/favorit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData }),
      });

      if (res.ok) {
        loadFavorit();
      }
    } catch {
      alert('Gagal memperbarui menu favorit');
    }
  };

  // Simpan Konten Web
  const handleSaveKonten = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/konten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kontenWeb),
      });
      if (res.ok) {
        alert('Konten website berhasil diperbarui!');
      }
    } catch {
      alert('Gagal menyimpan konten website');
    }
  };

  // Kelola Footer
  const handleSaveFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(footerData),
      });
      if (res.ok) {
        alert('Konten footer berhasil diperbarui!');
      }
    } catch {
      alert('Gagal menyimpan konten footer');
    }
  };

  // Tampilan orbit favorit
  const ubahOrbit = (perubahan: Partial<OrbitSetting>) =>
    setOrbitSetting((prev) => ({ ...prev, ...perubahan }));

  const handleSaveOrbit = async () => {
    try {
      const res = await fetch('/api/orbit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orbitSetting),
      });
      if (res.ok) {
        alert('Tampilan orbit berhasil disimpan!');
      } else {
        const json = await res.json().catch(() => null);
        alert(`Gagal menyimpan tampilan orbit.\n\n${json?.error || 'Server tidak merespons.'}`);
      }
    } catch {
      alert('Gagal menyimpan tampilan orbit. Cek koneksi atau terminal npm run dev.');
    }
  };

  // Ubah data slot (dari admin) jadi bentuk yang dibaca komponen orbit user
  const keItemOrbit = (daftar: FavoritSlot[]): FavoriteItem[] =>
    [...daftar]
      .sort((a, b) => a.slot - b.slot)
      .filter((f) => f.menu_id)
      .map((f) => {
        const m = menus.find((x) => x.id === f.menu_id);
        return {
          slot: f.slot,
          menu_id: f.menu_id ?? undefined,
          nama_makanan: m?.nama_makanan ?? f.nama_makanan ?? undefined,
          gambar: m?.gambar ?? f.gambar ?? undefined,
          pedas: m?.pedas ?? f.pedas ?? 0,
          deskripsi: m?.deskripsi ?? f.deskripsi ?? null,
        };
      });

  // Cabang (Lokasi)
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch),
      });
      if (res.ok) {
        alert('Cabang berhasil ditambahkan!');
        setNewBranch({ nama: '', alamat: '', latitude: '', longitude: '' });
        loadBranches();
      }
    } catch {
      alert('Gagal menambah cabang');
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm('Hapus cabang ini?')) return;
    const res = await fetch(`/api/maps/${id}`, { method: 'DELETE' });
    if (!res.ok) alert('Gagal menghapus cabang. Mungkin masih dipakai data lain.');
    loadBranches();
  };

  // FAQ Handlers
  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaq),
      });
      if (res.ok) {
        alert('FAQ berhasil ditambahkan!');
        setNewFaq({ pertanyaan: '', jawaban: '' });
        loadFaq();
      }
    } catch {
      alert('Gagal menambah FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Hapus FAQ ini?')) return;
    await fetch(`/api/faq/${id}`, { method: 'DELETE' });
    loadFaq();
  };

  // Pesanan Handlers
  const handleUpdateStatusPesanan = async (id: number, status: string) => {
    await fetch(`/api/pesanan/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadAllData();
  };

  // Data grafik beranda
  // Data grafik beranda
  const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const tglLokal = (d: Date) => d.toLocaleDateString('en-CA');

  const pesananPerHari = tanggalSekarang
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(tanggalSekarang);
        d.setDate(d.getDate() - (6 - i));

        const kunci = tglLokal(d);

        return {
          label: d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
          }),
          value: pesananList.filter(
            (p) =>
              p.created_at &&
              tglLokal(new Date(p.created_at)) === kunci
          ).length,
        };
      })
    : [];
  const hitungStatus = (daftar: { status: string }[], cocok: string[]) =>
    daftar.filter((x) => cocok.includes(x.status)).length;
  const statusPesananChart = [
    { label: 'Pending', value: hitungStatus(pesananList, ['pending']), warna: '#e0a526' },
    { label: 'Diproses', value: hitungStatus(pesananList, ['diproses']), warna: '#4a7fd1' },
    { label: 'Selesai', value: hitungStatus(pesananList, ['selesai']), warna: '#3d9a5f' },
  ];
  const statusReservasiChart = [
    { label: 'Pending', value: hitungStatus(reservasiList, ['pending']), warna: '#e0a526' },
    { label: 'Dikonfirmasi', value: hitungStatus(reservasiList, ['approved', 'dikonfirmasi']), warna: '#4a7fd1' },
    { label: 'Selesai', value: hitungStatus(reservasiList, ['complete', 'selesai']), warna: '#3d9a5f' },
    { label: 'Dibatalkan', value: hitungStatus(reservasiList, ['dibatalkan', 'cancelled']), warna: '#c0524a' },
  ];
  const labelRentang = pendapatanRange === 'hari' ? 'hari ini (per jam)' : `${pendapatanRange} hari terakhir`;

  if (!isLoggedIn) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
        <div className="card shadow-lg p-4" style={{ maxWidth: '420px', width: '100%', borderRadius: '12px' }}>
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark">Admin Papeda</h3>
            <p className="text-muted small">Masuk untuk mengelola restoran</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-bold">Username</label>
              <input
                type="text"
                className="form-control"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMsg && <div className="alert alert-danger py-2 small">{errorMsg}</div>}
            <button type="submit" className="btn btn-warning w-100 fw-bold text-white mb-2">
              Masuk
            </button>
            <Link href="/" className="btn btn-outline-secondary w-100 btn-sm">
              Kembali ke Beranda
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout d-flex">
      {/* Sidebar */}
      <aside className="admin-sidebar sidebar text-white p-3 d-flex flex-column shadow-sm">
        <h2 className="text-center mb-4 fs-4 fw-bold mt-2">
          Admin Papeda
        </h2>
          <ul className="admin-nav nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'statistik' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('statistik')}
            >
              <i className="fa-solid fa-chart-line me-2"></i> Beranda & Statistik
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'pendapatan' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('pendapatan')}
            >
              <i className="fa-solid fa-sack-dollar me-2"></i> Laporan Pendapatan
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'menu' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              <i className="fa-solid fa-utensils me-2"></i> Kelola Menu
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'favorit' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('favorit')}
            >
              <i className="fa-solid fa-star me-2"></i> Kelola Menu Favorit
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'konten' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('konten')}
            >
              <i className="fa-solid fa-pen-to-square me-2"></i> Kelola Halaman
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'pesanan' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('pesanan')}
            >
              <i className="fa-solid fa-receipt me-2"></i> Kelola Pesanan
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'reservasi' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('reservasi')}
            >
              <i className="fa-solid fa-calendar-check me-2"></i> Kelola Reservasi & Ruangan
            </button>
          </li>
        </ul>
        <div className="mt-auto pt-3 border-top border-secondary">
          <button type="button" onClick={handleLogout} className="btn btn-outline-light w-100 btn-sm">
            <i className="fa-solid fa-right-from-bracket me-2"></i> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main flex-grow-1 p-4 overflow-auto">
        {/* TAB 1: STATISTIK */}
        {activeTab === 'statistik' && (
          <><div>
            <h1 className="fs-3 fw-bold mb-4">Dashboard Statistik</h1>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="card shadow-sm border-0 p-3 text-center">
                  <div className="fs-2 fw-bold text-warning">{menus.length}</div>
                  <div className="text-muted small">Total Menu</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm border-0 p-3 text-center">
                  <div className="fs-2 fw-bold text-primary">{pesananList.length}</div>
                  <div className="text-muted small">Total Pesanan</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm border-0 p-3 text-center">
                  <div className="fs-2 fw-bold text-success">{reservasiList.length}</div>
                  <div className="text-muted small">Total Reservasi</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card shadow-sm border-0 p-3 text-center">
                  <div className="fs-2 fw-bold text-info">{statistik?.jumlah_pengunjung || 0}</div>
                  <div className="text-muted small">Total Pengunjung</div>
                </div>
              </div>
            </div>
          </div><div className="row g-3 mb-3">
              <div className="col-lg-7">
                <div className="card chart-card shadow-sm border-0 p-4 h-100">
                  <h5 className="fw-bold">Pesanan 7 Hari Terakhir</h5>
                  <p className="chart-sub">Jumlah pesanan masuk per hari (semua status)</p>
                  <BarChart data={pesananPerHari} format={(n) => `${n} pesanan`} kosong="Belum ada pesanan dalam 7 hari terakhir." />
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card chart-card shadow-sm border-0 p-4 h-100">
                  <h5 className="fw-bold">Status Pesanan</h5>
                  <p className="chart-sub">{pesananList.length} pesanan seluruhnya</p>
                  <StatusBars items={statusPesananChart} />
                </div>
              </div>
            </div><div className="row g-3">
              <div className="col-lg-7">
                <div className="card chart-card shadow-sm border-0 p-4 h-100">
                  <h5 className="fw-bold">Pendapatan</h5>
                  <p className="chart-sub">Dari pesanan selesai, {labelRentang}</p>
                  <BarChart
                    data={(pendapatanData?.grafik || []).map((g) => ({
                      label: pendapatanRange === 'hari' ? g.label : g.label.slice(5).split('-').reverse().join('/'),
                      value: g.total,
                    }))}
                    format={rupiah}
                    ringkas={singkat}
                    kosong="Belum ada pendapatan pada rentang ini." />
                </div>
              </div>
              <div className="col-lg-5">
                <div className="card chart-card shadow-sm border-0 p-4 h-100">
                  <h5 className="fw-bold">Status Reservasi</h5>
                  <p className="chart-sub">{reservasiList.length} reservasi seluruhnya</p>
                  <StatusBars items={statusReservasiChart} />
                </div>
              </div>
            </div></>
        )}

        {/* TAB 2: PENDAPATAN */}
        {activeTab === 'pendapatan' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-3 fw-bold mb-0">Laporan Pendapatan Restoran</h1>
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn btn-sm ${pendapatanRange === 'hari' ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setPendapatanRange('hari')}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${pendapatanRange === '7' ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setPendapatanRange('7')}
                >
                  7 Hari Terakhir
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${pendapatanRange === '30' ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setPendapatanRange('30')}
                >
                  30 Hari Terakhir
                </button>
              </div>
            </div>

            {!pendapatanData ? (
              <div className="alert alert-warning">Data pendapatan belum bisa dimuat. Coba refresh halaman.</div>
            ) : (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="card shadow-sm border-0 p-3 text-center">
                      <div className="fs-4 fw-bold text-success">
                        Rp {pendapatanData.ringkasan.total.toLocaleString('id-ID')}
                      </div>
                      <div className="text-muted small">Total Pendapatan</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm border-0 p-3 text-center">
                      <div className="fs-4 fw-bold text-primary">
                        {pendapatanData.ringkasan.pesanan}
                      </div>
                      <div className="text-muted small">Pesanan Selesai</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm border-0 p-3 text-center">
                      <div className="fs-4 fw-bold text-warning">
                        {pendapatanData.ringkasan.item}
                      </div>
                      <div className="text-muted small">Item Terjual</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card shadow-sm border-0 p-3 text-center">
                      <div className="fs-4 fw-bold text-info">
                        Rp {pendapatanData.ringkasan.rata.toLocaleString('id-ID')}
                      </div>
                      <div className="text-muted small">Rata-rata per Pesanan</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-5">
                    <div className="card shadow-sm border-0 p-3 h-100">
                      <h5 className="fw-bold mb-3">Top 5 Menu Terlaris</h5>
                      <ul className="list-group list-group-flush">
                        {pendapatanData.terlaris.length === 0 ? (
                          <li className="list-group-item text-muted">Belum ada data penjualan</li>
                        ) : (
                          pendapatanData.terlaris.map((m, idx) => (
                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                              <div>
                                <span className="fw-bold me-2">#{idx + 1}</span>
                                <span>{m.nama}</span>
                              </div>
                              <span className="badge bg-warning text-dark">{m.qty} porsi</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="card shadow-sm border-0 p-3 h-100">
                      <h5 className="fw-bold mb-3">Rincian Laporan Harian</h5>
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Tanggal</th>
                              <th>Pesanan</th>
                              <th>Item</th>
                              <th>Total Pendapatan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendapatanData.laporan.map((h, i) => (
                              <tr key={i}>
                                <td>{h.tanggal}</td>
                                <td>{h.pesanan}</td>
                                <td>{h.item}</td>
                                <td className="fw-bold text-success">Rp {h.pendapatan.toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: MENU */}
        {activeTab === 'menu' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="fs-3 fw-bold mb-0">Kelola Menu Makanan</h1>
            </div>

            <div id="form-menu" className="card shadow-sm border-0 p-4 mb-4">
              <h5 className="fw-bold mb-3">{editMenuId !== null ? 'Edit Menu' : 'Tambah Menu Baru'}</h5>
              <form onSubmit={handleAddMenu} className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Kategori</label>
                  <select
                    className="form-select"
                    value={newMenu.nama_kategori}
                    onChange={(e) => setNewMenu({ ...newMenu, nama_kategori: e.target.value })}
                  >
                    <option value="APPETIZER">APPETIZER</option>
                    <option value="MAIN COURSE">MAIN COURSE</option>
                    <option value="DESSERT">DESSERT</option>
                    <option value="MINUMAN">MINUMAN</option>
                    {!['APPETIZER', 'MAIN COURSE', 'DESSERT', 'MINUMAN'].includes(newMenu.nama_kategori) && (
                      <option value={newMenu.nama_kategori}>{newMenu.nama_kategori}</option>
                    )}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Nama Menu</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newMenu.nama_makanan}
                    onChange={(e) => setNewMenu({ ...newMenu, nama_makanan: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Harga (Rp)</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={newMenu.harga}
                    onChange={(e) => setNewMenu({ ...newMenu, harga: Number(e.target.value) })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">URL Gambar</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={newMenu.gambar}
                    onChange={(e) => setNewMenu({ ...newMenu, gambar: e.target.value })}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Level Pedas (0 - 5)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="5"
                    value={newMenu.pedas}
                    onChange={(e) => setNewMenu({ ...newMenu, pedas: Number(e.target.value) })}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end gap-2">
                  <button type="submit" className="btn btn-warning w-100 text-white fw-bold">
                    {editMenuId !== null ? 'Simpan Perubahan' : '+ Tambah Menu'}
                  </button>
                  {editMenuId !== null && (
                    <button type="button" className="btn btn-outline-secondary fw-bold" onClick={resetFormMenu}>
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card shadow-sm border-0 p-3">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Gambar</th>
                    <th>Nama</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <img src={m.gambar} alt={m.nama_makanan} width="48" height="48" style={{ objectFit: 'cover', borderRadius: '4px' }} />
                      </td>
                      <td className="fw-bold">{m.nama_makanan}</td>
                      <td><span className="badge bg-secondary">{m.nama_kategori}</span></td>
                      <td>Rp {m.harga.toLocaleString('id-ID')}</td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm ${m.status ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => handleToggleMenuStatus(m)}
                        >
                          {m.status ? 'Tersedia' : 'Habis'}
                        </button>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditMenu(m)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteMenu(m.id)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FAVORIT (pilih menu + atur tampilan orbit) */}
        {activeTab === 'favorit' && (
          <div>
            <h1 className="fs-3 fw-bold mb-2">Kelola Menu Favorit (Chef&apos;s Recommendation)</h1>
            <p className="text-muted mb-4">
              Atur menu dan tampilan orbit di kiri, hasilnya langsung terlihat di preview kanan.
            </p>

            <div className="row g-4 align-items-start orbit-layout">
              <div className="col-lg-5 orbit-controls">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {ORBIT_TAB.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className={`btn btn-sm fw-bold ${orbitTab === m.key ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setOrbitTab(m.key)}
                    >
                      <i className={`fa-solid ${m.icon} me-2`}></i>
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="card shadow-sm border-0 p-4 mb-3">
                  {/* Menu */}
                  {orbitTab === 'menu' && (
                    <>
                      <label className="form-label small fw-bold">Sumber Menu</label>
                      <div className="orbit-opsi mb-2">
                        {MODE_ORBIT.map((o) => (
                          <button
                            key={o.nilai}
                            type="button"
                            className={`orbit-opsi-btn ${orbitSetting.mode === o.nilai ? 'aktif' : ''}`}
                            onClick={() => ubahOrbit({ mode: o.nilai })}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>

                      {orbitSetting.mode === 'manual' ? (
                        <>
                          <small className="text-muted d-block mb-3">
                            Pilih sendiri 5 menu. Pilihan menu langsung tersimpan.
                          </small>
                          {[1, 2, 3, 4, 5].map((slotNum) => {
                            const currentSlot = favoritList.find((f) => f.slot === slotNum);
                            const slotLabels = [
                              'Slot 1 (Tengah Bawah)',
                              'Slot 2 (Kiri Bawah)',
                              'Slot 3 (Kiri Atas)',
                              'Slot 4 (Kanan Atas)',
                              'Slot 5 (Kanan Bawah)',
                            ];

                            return (
                              <div key={slotNum} className="mb-2">
                                <label className="form-label fw-bold text-warning small mb-1">
                                  {slotLabels[slotNum - 1]}
                                </label>
                                <select
                                  className="form-select form-select-sm"
                                  value={currentSlot?.menu_id || ''}
                                  onChange={(e) => handleSaveFavorit(slotNum, Number(e.target.value))}
                                >
                                  <option value="">-- Pilih Menu --</option>
                                  {menus.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.nama_makanan} - ({m.nama_kategori})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          <small className="text-muted d-block mb-3">
                            Orbit otomatis menampilkan 5 menu dengan penjualan terbanyak (dari pesanan berstatus
                            selesai). Kalau data penjualan belum cukup, sisanya diisi dari pilihan manual.
                          </small>
                          <ol className="mb-0 ps-3">
                            {favoritTerlaris.length === 0 ? (
                              <li className="text-muted">Belum ada data penjualan.</li>
                            ) : (
                              favoritTerlaris.map((f) => (
                                <li key={f.slot} className="mb-1">
                                  {f.nama_makanan}
                                </li>
                              ))
                            )}
                          </ol>
                        </>
                      )}
                    </>
                  )}

                  {/* Gerakan */}
                  {orbitTab === 'gerak' && (
                    <>
                      <label className="form-label small fw-bold">Gerakan</label>
                      <div className="orbit-opsi mb-4">
                        {GERAK_ORBIT.map((o) => (
                          <button
                            key={o.nilai}
                            type="button"
                            className={`orbit-opsi-btn ${orbitSetting.gerak === o.nilai ? 'aktif' : ''}`}
                            onClick={() => ubahOrbit({ gerak: o.nilai })}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>

                      <label className="form-label small fw-bold">Kecepatan</label>
                      <div className="orbit-opsi">
                        {KECEPATAN_ORBIT.map((o) => (
                          <button
                            key={o.nilai}
                            type="button"
                            disabled={orbitSetting.gerak === 'diam'}
                            className={`orbit-opsi-btn ${orbitSetting.kecepatan === o.nilai ? 'aktif' : ''}`}
                            onClick={() => ubahOrbit({ kecepatan: o.nilai })}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      {orbitSetting.gerak === 'diam' && (
                        <small className="text-muted d-block mt-2">Kecepatan tidak berlaku kalau orbit diam.</small>
                      )}
                    </>
                  )}

                  {/* Bentuk & Warna */}
                  {orbitTab === 'bentuk' && (
                    <>
                      <label className="form-label small fw-bold">Bentuk Frame</label>
                      <div className="orbit-opsi mb-4">
                        {BENTUK_ORBIT.map((o) => (
                          <button
                            key={o.nilai}
                            type="button"
                            className={`orbit-opsi-btn ${orbitSetting.bentuk === o.nilai ? 'aktif' : ''}`}
                            onClick={() => ubahOrbit({ bentuk: o.nilai })}
                          >
                            <span className={`bentuk-contoh bentuk-contoh-${o.nilai}`}></span>
                            {o.label}
                          </button>
                        ))}
                      </div>

                      <label className="form-label small fw-bold">Warna Outline</label>
                      <div className="d-flex flex-wrap gap-2 mb-1">
                        {PALET_ORBIT.map((w) => (
                          <button
                            key={w.hex}
                            type="button"
                            title={w.nama}
                            aria-label={`Warna ${w.nama}`}
                            className={`orbit-warna ${orbitSetting.warna === w.hex ? 'aktif' : ''}`}
                            style={{ background: w.hex }}
                            onClick={() => ubahOrbit({ warna: w.hex })}
                          />
                        ))}
                      </div>
                      <small className="text-muted d-block">
                        Terpilih: {PALET_ORBIT.find((w) => w.hex === orbitSetting.warna)?.nama}
                      </small>
                    </>
                  )}
                </div>

                {/* Tombol simpan selalu terlihat, apa pun tab-nya */}
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-warning text-white fw-bold flex-grow-1 py-2"
                    onClick={handleSaveOrbit}
                  >
                    Simpan Tampilan Orbit
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setOrbitSetting({ ...ORBIT_DEFAULT, mode: orbitSetting.mode })}
                  >
                    Reset Tampilan
                  </button>
                </div>
              </div>

              {/* Visual Preview Menu Favorit */}
              <div className="col-lg-7 orbit-preview-column">
                <div className="card shadow-sm border-0 overflow-hidden sticky-top" style={{ top: '20px' }}>
                  <div className="preview-bar">
                    <span><i className="fa-solid fa-eye me-2"></i> Preview Orbit</span>
                    <span className="badge">Real-time</span>
                  </div>
                  <OrbitPreview
                    favorites={keItemOrbit(orbitSetting.mode === 'terlaris' ? favoritTerlaris : favoritList)}
                    setting={orbitSetting}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KELOLA (Home, About, FAQ, Lokasi, Footer + preview satu halaman) */}
        {activeTab === 'konten' && (
          <div>
            <h1 className="fs-3 fw-bold mb-3">Kelola Halaman Utama</h1>
            <p className="text-muted mb-4">
              Home, About, FAQ, Lokasi, dan Footer tampil dalam satu halaman di sisi pengunjung. Ubah di kiri, lihat
              hasilnya langsung di preview kanan.
            </p>

            <div className="row g-4 align-items-start">
              <div className="col-xl-5">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {KELOLA_MENU.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className={`btn btn-sm fw-bold ${kelolaTab === m.key ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setKelolaTab(m.key)}
                    >
                      <i className={`fa-solid ${m.icon} me-2`}></i>
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Home & About */}
                {kelolaTab === 'home' && (
                  <div className="card shadow-sm border-0 p-4">
                    <form onSubmit={handleSaveKonten}>
                      <div className="mb-3">
                        <label className="form-label small fw-bold" htmlFor="konten-hero">
                          <i className="fa-solid fa-bullhorn me-2 text-warning"></i>Judul Hero Banner
                        </label>
                        <textarea
                          id="konten-hero"
                          className="form-control"
                          rows={3}
                          value={kontenWeb.teks_hero || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, teks_hero: e.target.value })}
                        />
                        <small className="text-muted">Tekan Enter untuk pindah baris.</small>
                      </div>
                      <div className="mb-4">
                        <label className="form-label small fw-bold" htmlFor="konten-about">
                          <i className="fa-solid fa-circle-info me-2 text-warning"></i>Deskripsi Tentang Kami
                        </label>
                        <textarea
                          id="konten-about"
                          className="form-control"
                          rows={7}
                          value={kontenWeb.teks_about || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, teks_about: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="btn btn-warning text-white fw-bold w-100 py-2">
                        Simpan Perubahan Konten
                      </button>
                    </form>
                  </div>
                )}

                {/* FAQ */}
                {kelolaTab === 'faq' && (
                  <>
                    <div className="card shadow-sm border-0 p-4 mb-4">
                      <h5 className="fw-bold mb-3">Tambah FAQ</h5>
                      <form onSubmit={handleAddFaq}>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">Pertanyaan</label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            value={newFaq.pertanyaan}
                            onChange={(e) => setNewFaq({ ...newFaq, pertanyaan: e.target.value })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">Jawaban</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            required
                            value={newFaq.jawaban}
                            onChange={(e) => setNewFaq({ ...newFaq, jawaban: e.target.value })}
                          />
                        </div>
                        <button type="submit" className="btn btn-warning text-white fw-bold">
                          Simpan FAQ
                        </button>
                      </form>
                    </div>

                    <div className="card shadow-sm border-0 p-3 mb-4">
                      <h5 className="fw-bold mb-3">Daftar FAQ</h5>
                      <ul className="list-group list-group-flush">
                        {faqList.map((f) => (
                          <li key={f.id} className="list-group-item d-flex justify-content-between align-items-start gap-2">
                            <div>
                              <div className="fw-bold">{f.pertanyaan}</div>
                              <div className="small text-muted">{f.jawaban}</div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteFaq(f.id)}
                            >
                              Hapus
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="card shadow-sm border-0 p-3">
                      <h5 className="fw-bold mb-3">Pertanyaan Masuk dari Pengunjung (Modal)</h5>
                      <ul className="list-group list-group-flush">
                        {pertanyaanList.length === 0 ? (
                          <li className="list-group-item text-muted">Belum ada pertanyaan masuk.</li>
                        ) : (
                          pertanyaanList.map((q) => (
                            <li key={q.id} className="list-group-item">
                              <div className="fw-bold">{q.pertanyaan}</div>
                              <small className="text-muted">Dari: {q.nama} ({q.email || 'tanpa email'})</small>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </>
                )}

                {/* Lokasi */}
                {kelolaTab === 'lokasi' && (
                  <>
                    <div className="card shadow-sm border-0 p-4 mb-4">
                      <h5 className="fw-bold mb-3">Tambah Cabang</h5>
                      <form onSubmit={handleAddBranch}>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">Nama Cabang</label>
                          <input
                            type="text"
                            className="form-control"
                            required
                            value={newBranch.nama}
                            onChange={(e) => setNewBranch({ ...newBranch, nama: e.target.value })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-bold">Alamat</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            required
                            value={newBranch.alamat}
                            onChange={(e) => setNewBranch({ ...newBranch, alamat: e.target.value })}
                          />
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <label className="form-label small fw-bold">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              className="form-control"
                              required
                              value={newBranch.latitude}
                              onChange={(e) => setNewBranch({ ...newBranch, latitude: e.target.value })}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-bold">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              className="form-control"
                              required
                              value={newBranch.longitude}
                              onChange={(e) => setNewBranch({ ...newBranch, longitude: e.target.value })}
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-warning text-white fw-bold">
                          Simpan Cabang
                        </button>
                      </form>
                    </div>

                    <div className="card shadow-sm border-0 p-3">
                      <h5 className="fw-bold mb-1">Daftar Cabang</h5>
                      <small className="text-muted d-block mb-3">
                        Dipakai untuk peta lokasi dan pilihan gerai saat reservasi.
                      </small>
                      <ul className="list-group list-group-flush">
                        {branches.length === 0 ? (
                          <li className="list-group-item text-muted">Belum ada cabang.</li>
                        ) : (
                          branches.map((b) => (
                            <li key={b.id} className="list-group-item d-flex justify-content-between align-items-start gap-2">
                              <div>
                                <div className="fw-bold">{b.nama}</div>
                                <div className="small text-muted">{b.alamat}</div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteBranch(b.id)}
                              >
                                Hapus
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </>
                )}

                {/* Footer */}
                {kelolaTab === 'footer' && (
                  <div className="card shadow-sm border-0 p-4">
                    <form onSubmit={handleSaveFooter}>
                      {(
                        [
                          ['judul', 'Judul Footer', 'text'],
                          ['copyright', 'Copyright Teks', 'text'],
                          ['link_wa', 'Tautan WhatsApp', 'text'],
                          ['link_ig', 'Tautan Instagram', 'text'],
                          ['link_tiktok', 'Tautan TikTok', 'text'],
                          ['email', 'Email Restoran', 'email'],
                          ['link_linkedin', 'Tautan LinkedIn', 'text'],
                        ] as [keyof FooterData, string, string][]
                      ).map(([kunci, label, tipe]) => (
                        <div className="mb-3" key={kunci}>
                          <label className="form-label small fw-bold" htmlFor={`footer-${kunci}`}>{label}</label>
                          <input
                            id={`footer-${kunci}`}
                            type={tipe}
                            className="form-control"
                            value={(footerData[kunci] as string | undefined) ?? ''}
                            onChange={(e) => setFooterData({ ...footerData, [kunci]: e.target.value })}
                          />
                        </div>
                      ))}
                      <button type="submit" className="btn btn-warning text-white fw-bold w-100 py-2">
                        Simpan Perubahan Footer
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Preview satu halaman: Home > About > FAQ > Lokasi > Footer */}
              <div className="col-xl-7">
                <div className="card shadow-sm border-0 overflow-hidden sticky-top" style={{ top: '20px' }}>
                  <div className="preview-bar">
                    <span><i className="fa-solid fa-eye me-2"></i> Preview Halaman Utama</span>
                    <span className="badge">Real-time</span>
                  </div>
                  <div className="preview-scroll" ref={previewRef}>
                    <HalamanPreview
                      teksHero={kontenWeb.teks_hero}
                      teksAbout={kontenWeb.teks_about}
                      faqList={faqList}
                      branches={branches}
                      footer={footerData}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PESANAN */}
        {activeTab === 'pesanan' && (
          <div>
            <h1 className="fs-3 fw-bold mb-4">Daftar Pesanan Masuk</h1>
            <div className="card shadow-sm border-0 p-3">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Pelanggan</th>
                    <th>Item</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ubah Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pesananList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">Belum ada pesanan masuk.</td>
                    </tr>
                  )}
                  {pesananList.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td className="fw-bold">{p.nama}</td>
                      <td className="small" style={{ maxWidth: '300px' }}>{ringkasItem(p.item)}</td>
                      <td>Rp {Number(p.total || 0).toLocaleString('id-ID')}</td>
                      <td><span className={`badge ${STATUS_PESANAN[p.status] || 'bg-secondary'}`}>{p.status}</span></td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleUpdateStatusPesanan(p.id, 'diproses')}
                          >
                            Proses
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-success"
                            onClick={() => handleUpdateStatusPesanan(p.id, 'selesai')}
                          >
                            Selesai
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: RESERVASI */}
        {activeTab === 'reservasi' && (
          <div>
            <h1 className="fs-3 fw-bold mb-3">Kelola Reservasi &amp; Ruangan</h1>

            {/* LEVEL 1: gaya sama dengan Kelola Halaman */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {RESERVASI_MENU.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`btn btn-sm fw-bold ${reservasiMenu === m.key ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setReservasiMenu(m.key)}
                >
                  <i className={`fa-solid ${m.icon} me-2`}></i>
                  {m.label}
                </button>
              ))}
            </div>

            {/* ===================== MENU: RESERVASI ===================== */}
            {reservasiMenu === 'reservasi' && (
              <div className="card shadow-sm border-0 p-4 mb-4">
                <div className="reservation-toolbar">
                  <div className="reservation-tabs">
                    {([
                      ['user', 'Users', usersList.length],
                      ['pending', 'Pending', countReservasi('pending')],
                      ['approved', 'Approved', countReservasi('approved')],
                      ['complete', 'Complete', countReservasi('complete')],
                      ['dibatalkan', 'Dibatalkan', countReservasi('dibatalkan')],
                    ] as [ReservasiTabKey, string, number][]).map(([key, label, count]) => (
                      <button
                        key={key}
                        type="button"
                        className={`tab-btn ${reservasiTab === key ? 'active' : ''}`}
                        onClick={() => {
                          setReservasiTab(key);
                          if (key === 'user') loadUsers();
                          else loadReservasiAdmin();
                        }}
                      >
                        {label} <span className="badge">{count}</span>
                      </button>
                    ))}
                  </div>

                  <div className="reservation-tools">
                    <button
                      type="button"
                      className={`filter-button ${userFilter ? 'on' : ''}`}
                      title={
                        reservasiTab === 'user'
                          ? `Filter user: ${userFilter === '' ? 'semua' : userFilter === 'active' ? 'aktif' : 'diblokir'}`
                          : 'Filter'
                      }
                      onClick={() => reservasiTab === 'user' && toggleFilterUser()}
                    >
                      <i className="fa-solid fa-filter"></i>
                    </button>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Cari data..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value.trim() === '' ? '' : e.target.value)}
                    />
                  </div>
                </div>

                {/* TAB USERS */}
                {reservasiTab === 'user' && (
                  <div>
                    {selectedUsers.length > 0 && (
                      <div className="user-action-bar d-flex justify-content-between align-items-center p-3 mb-3 rounded border">
                        <span className="fw-semibold text-secondary">{selectedUsers.length} akun dipilih</span>
                        <div className="d-flex align-items-center gap-2">
                          <div className="custom-action-dropdown position-relative">
                            <button
                              type="button"
                              className="btn form-select form-select-sm text-start shadow-none"
                              onClick={() => setAksiOpen((o) => !o)}
                            >
                              {AKSI_LABEL[userAksi]}
                            </button>
                            {aksiOpen && (
                              <ul className="aksi-menu shadow-sm">
                                {(['', 'modifikasi', 'blokir', 'hapus'] as UserAksi[]).map((a) => (
                                  <li key={a || 'none'}>
                                    <button
                                      type="button"
                                      className={`aksi-item ${a === 'blokir' ? 'text-danger' : a === 'hapus' ? 'text-secondary' : ''}`}
                                      onClick={() => {
                                        setUserAksi(a);
                                        setAksiOpen(false);
                                      }}
                                    >
                                      {a === '' ? 'Pilih Aksi...' : AKSI_LABEL[a]}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <button type="button" className="btn btn-sm btn-dark fw-bold" onClick={handleEksekusiAksiUser}>
                            Terapkan
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="table-responsive">
                      <table className="table table-striped align-middle">
                        <thead className="table-dark">
                          <tr className="text-center">
                            <th className="th-checkbox">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={allUsersChecked}
                                onChange={toggleCheckAll}
                              />
                            </th>
                            <th>User ID</th>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>Tanggal Pembuatan</th>
                            <th>Jumlah Reserve</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody id="user-table-body">
                          {usersList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center text-muted py-4">Belum ada user terdaftar.</td>
                            </tr>
                          ) : filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center text-muted py-4">Tidak ada user yang cocok.</td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => {
                              const aktif = isUserActive(u);
                              const idx = usersList.indexOf(u);
                              return (
                                <tr key={String(u.id)}>
                                  <td className="text-center">
                                    <input
                                      type="checkbox"
                                      className="form-check-input user-row-check"
                                      checked={selectedUsers.includes(String(u.id))}
                                      onChange={() => toggleUserCheck(String(u.id))}
                                    />
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-dark border font-monospace">
                                      {String(idx + 1).padStart(5, '0')}
                                    </span>
                                  </td>
                                  <td><strong>{u.nama || '-'}</strong></td>
                                  <td>{u.email || '-'}</td>
                                  <td className="text-center">
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                                  </td>
                                  <td className="text-center">
                                    <span className="badge bg-light text-dark border">{u.total_reserve || '0'}</span>
                                  </td>
                                  <td className="text-center">
                                    <span className={`badge ${aktif ? 'bg-success' : 'bg-danger'}`}>
                                      {aktif ? 'Active' : 'Blocked'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB RESERVASI PENDING DLL */}
                {reservasiTab !== 'user' && (
                  <div className="table-responsive">
                    <table className="admin-table table table-striped align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th className="text-center">Gerai</th>
                          <th className="text-center">Nama Tamu</th>
                          <th className="text-center">Kontak</th>
                          <th className="text-center">Tanggal &amp; Waktu</th>
                          <th className="text-center">Jumlah Tamu</th>
                          <th className="text-center">Ruangan</th>
                          <th className="text-center">Catatan</th>
                          <th className="text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody id="reservation-table-body">
                        {filteredReservasi.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center text-muted py-4">
                              Tidak ada reservasi pada status ini.
                            </td>
                          </tr>
                        ) : (
                          filteredReservasi.map((r) => {
                            const selesai = r.status === 'complete' || r.status === 'selesai';
                            const batal = r.status === 'dibatalkan' || r.status === 'cancelled';
                            const approved = r.status === 'approved' || r.status === 'dikonfirmasi';
                            return (
                              <tr key={r.id}>
                                <td><strong>{r.gerai || '-'}</strong></td>
                                <td>{r.nama || '-'}</td>
                                <td>
                                  {r.telepon || '-'}
                                  <br />
                                  <small className="text-muted">{r.email || '-'}</small>
                                </td>
                                  <td>
                                    {r.tanggal || '-'}
                                    <br />
                                    <td>
                                    {r.tanggal || '-'}
                                    <br />
                                    <small>{r.sesi ? `(${r.sesi})` : ''}</small>
                                    {r.jam && (
                                      <>
                                        <br />
                                        <small className="text-muted">Dipesan pukul {r.jam}</small>
                                      </>
                                    )}
                                  </td>
                                </td>
                                <td>{r.jumlah || 0} Orang</td>
                                <td>{r.ruangan || '-'}</td>
                                <td>{r.catatan || '-'}</td>
                                <td className="aksi">
                                  {selesai ? (
                                    <span className="badge bg-success">Selesai</span>
                                  ) : batal ? (
                                    <span className="badge bg-danger">Dibatalkan</span>
                                  ) : (
                                    <div className="reservation-actions">
                                      <button
                                        type="button"
                                        className="btn-action-confirm"
                                        onClick={() => handleUbahStatusReservasi(r.id, approved ? 'complete' : 'approved')}
                                      >
                                        {approved ? '✓ Selesaikan' : '✓ Konfirmasi'}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-action-cancel"
                                        onClick={() => handleUbahStatusReservasi(r.id, 'dibatalkan')}
                                      >
                                        ✕ Batalkan
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ===================== MENU: RUANGAN ===================== */}
            {reservasiMenu === 'ruangan' && (
              <div className="card shadow-sm border-0 p-4 mb-4">
                <div className="row g-2 mb-3">
                  <div className="col-md-5">
                    <select
                      className="form-select"
                      value={ruanganGerai}
                      onChange={(e) => setRuanganGerai(e.target.value)}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.nama}>{b.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <input
                      type="date"
                      className="form-control"
                      value={ruanganTanggal}
                      onChange={(e) => setRuanganTanggal(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={ruanganSesi}
                      onChange={(e) => setRuanganSesi(e.target.value)}
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="night">Evening</option>
                    </select>
                  </div>
                </div>

                <h2 className="fs-5 fw-bold mt-2">Ruangan Reguler</h2>
                <p className="text-muted small">
                  Jumlah berlaku untuk semua tanggal dan sesi di gerai ini. Terpakai, Sisa, dan Ketersediaan mengikuti
                  tanggal dan sesi di atas. Tutup Paksa menutup ruangan untuk semua tanggal sampai dibuka kembali.
                </p>
                <div className="table-responsive mb-4">
                  <table className="table table-striped align-middle">
                    <thead className="table-dark">
                      <tr className="text-center">
                        <th>Ruangan</th>
                        <th>Jumlah</th>
                        <th>Terpakai</th>
                        <th>Sisa</th>
                        <th>Ketersediaan</th>
                        <th>Pengaturan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ruanganList.filter((r) => r.grup === 'Reguler').map((r) => (
                        <tr key={r.ruangan} className="text-center">
                          <td className="text-start">{r.label}</td>
                          <td>
                            <div className="d-inline-flex align-items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={(r.jumlah ?? 0) <= 0}
                                onClick={() => ubahJumlahRuangan(r, (r.jumlah ?? 0) - 1)}
                              >
                                −
                              </button>
                              <input
                                key={`${r.ruangan}-${r.jumlah}`}
                                type="number"
                                min={0}
                                max={50}
                                className="form-control form-control-sm text-center"
                                style={{ width: 70 }}
                                defaultValue={r.jumlah ?? 0}
                                onBlur={(e) => {
                                  const n = Number(e.target.value);
                                  if (n !== r.jumlah) ubahJumlahRuangan(r, n);
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                disabled={(r.jumlah ?? 0) >= 50}
                                onClick={() => ubahJumlahRuangan(r, (r.jumlah ?? 0) + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>{r.terpakai}</td>
                          <td><strong>{r.sisa}</strong></td>
                          <td>
                            <span className={`badge ${r.tersedia ? 'bg-success' : 'bg-danger'}`}>
                              {r.tersedia ? 'Tersedia' : 'Tidak Tersedia'}
                            </span>
                            {statusRoomInfo(r) && <div className="small text-muted">{statusRoomInfo(r)}</div>}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`btn btn-sm ${r.status ? 'btn-outline-danger' : 'btn-success'}`}
                              onClick={() => toggleStatusRuangan(r)}
                            >
                              {r.status ? 'Maintenance' : 'Buka Kembali'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h2 className="fs-5 fw-bold">Ruangan VIP</h2>
                <p className="text-muted small">
                  Ruangan otomatis Tidak Tersedia pada tanggal dan sesi yang sudah dipesan.
                </p>
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead className="table-dark">
                      <tr className="text-center">
                        <th>Ruangan</th>
                        <th>Ketersediaan</th>
                        <th>Pengaturan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ruanganList.filter((r) => r.grup === 'VIP Room').map((r) => (
                        <tr key={r.ruangan} className="text-center">
                          <td className="text-start">{r.label}</td>
                          <td>
                            <span className={`badge ${r.tersedia ? 'bg-success' : 'bg-danger'}`}>
                              {r.tersedia ? 'Tersedia' : 'Tidak Tersedia'}
                            </span>
                            {statusRoomInfo(r) && <div className="small text-muted">{statusRoomInfo(r)}</div>}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`btn btn-sm ${r.status ? 'btn-outline-danger' : 'btn-success'}`}
                              onClick={() => toggleStatusRuangan(r)}
                            >
                              {r.status ? 'Maintenance' : 'Buka Kembali'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {ruanganPesan && <small className="text-muted">{ruanganPesan}</small>}
              </div>
            )}

            {/* RESERVASI KONFIRMASI (di luar kedua menu supaya selalu bisa muncul) */}
            {confirmState && (
              <div className="confirm-backdrop" onClick={() => setConfirmState(null)}>
                <div className="custom-confirm-modal" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="btn-close confirm-close" aria-label="Close" onClick={() => setConfirmState(null)} />
                  <div className="modal-warning-icon">{confirmState.icon}</div>
                  <h4 className="confirm-title">{confirmState.title}</h4>
                  <p className="confirm-message">{confirmState.message}</p>
                  <div className="d-flex justify-content-center gap-2 mt-4">
                    <button type="button" className="btn-confirm-back" onClick={() => setConfirmState(null)}>
                      Kembali
                    </button>
                    <button
                      type="button"
                      className="btn-confirm-danger"
                      style={confirmState.danger ? undefined : { background: '#4a2c17', borderColor: '#4a2c17' }}
                      onClick={() => {
                        const fn = confirmState.onConfirm;
                        setConfirmState(null);
                        fn();
                      }}
                    >
                      {confirmState.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
