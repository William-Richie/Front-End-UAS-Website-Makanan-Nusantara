'use client';

import './admin-global.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, StatusBars, singkat } from '@/components/Admin/Beranda/AdminCharts';
import { KontenPreview, FooterPreview } from '@/components/Admin/Preview/SitePreview';

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

export interface StatistikData {
  id: number;
  jumlah_pengunjung: number;
}

export interface FavoritSlot {
  slot: number;
  menu_id: number | null;
  nama_makanan: string | null;
  gambar: string | null;
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
    'statistik' | 'menu' | 'favorit' | 'konten' | 'footer' | 'faq' | 'pesanan' | 'reservasi' | 'pendapatan'
  >('statistik');

  // Typed Data States
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [pesananList, setPesananList] = useState<PesananItem[]>([]);
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [pertanyaanList, setPertanyaanList] = useState<FaqPertanyaanItem[]>([]);
  const [reservasiList, setReservasiList] = useState<ReservasiItem[]>([]);
  const [statistik, setStatistik] = useState<StatistikData | null>(null);
  const [favoritList, setFavoritList] = useState<FavoritSlot[]>([]);
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
  const [aksiOpen, setAksiOpen] = useState<boolean>(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const [pendapatanData, setPendapatanData] = useState<PendapatanSummary | null>(null);
  const [pendapatanRange, setPendapatanRange] = useState<string>('7');
  const [tanggalSekarang] = useState<Date | null>(() => new Date());

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
    const adminSession = localStorage.getItem('papeda_admin_logged');
    if (adminSession === 'true') {
      const timer = setTimeout(() => setIsLoggedIn(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

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
    ambil('/api/favorit').then((d) => setFavoritList(daftar<FavoritSlot>(d)));
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
      localStorage.setItem('papeda_admin_logged', 'true');
      setIsLoggedIn(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Username atau password admin salah (default: admin / admin123)');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('papeda_admin_logged');
    setIsLoggedIn(false);
  };

  // Menu Handlers
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenu),
      });
      if (res.ok) {
        alert('Menu berhasil ditambahkan!');
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
      }
    } catch {
      alert('Gagal menambah menu');
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Hapus menu ini?')) return;
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
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
        loadAllData();
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
        loadAllData();
      }
    } catch {
      alert('Gagal menambah FAQ');
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Hapus FAQ ini?')) return;
    await fetch(`/api/faq/${id}`, { method: 'DELETE' });
    loadAllData();
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
    <div className="admin-layout d-flex vh-100 overflow-hidden">
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
              <i className="fa-solid fa-pen-to-square me-2"></i> Kelola Konten & Preview
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
              <i className="fa-solid fa-calendar-check me-2"></i> Kelola Reservasi
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'faq' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              <i className="fa-solid fa-circle-question me-2"></i> Kelola FAQ
            </button>
          </li>
          <li className="nav-item mb-2">
            <button
              className={`nav-link text-white text-start w-100 ${activeTab === 'footer' ? 'active bg-warning' : ''}`}
              onClick={() => setActiveTab('footer')}
            >
              <i className="fa-solid fa-shoe-prints me-2"></i> Kelola Footer
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

            <div className="card shadow-sm border-0 p-4 mb-4">
              <h5 className="fw-bold mb-3">Tambah Menu Baru</h5>
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
                <div className="col-md-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-warning w-100 text-white fw-bold">
                    + Tambah Menu
                  </button>
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
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteMenu(m.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FAVORIT */}
        {activeTab === 'favorit' && (
          <div>
            <h1 className="fs-3 fw-bold mb-2">Kelola Menu Favorit (Chef&apos;s Recommendation)</h1>
            <p className="text-muted mb-4">
              Pilih 5 menu yang akan ditampilkan pada animasi orbit di halaman utama pengunjung.
            </p>

            <div className="row g-4">
              <div className="col-lg-7">
                <div className="card shadow-sm border-0 p-4">
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
                      <div key={slotNum} className="mb-3 p-3 border rounded bg-white">
                        <label className="form-label fw-bold text-warning small mb-1">
                          {slotLabels[slotNum - 1]}
                        </label>
                        <select
                          className="form-select"
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
                </div>
              </div>

              {/* Visual Preview Menu Favorit */}
              <div className="col-lg-5">
                <div className="card bg-white shadow-sm border-0 p-4 h-100 d-flex flex-column align-items-center justify-content-center">
                  <h5 className="fw-bold mb-1 text-center">
                    <i className="fa-solid fa-eye me-2"></i>Visual Preview
                  </h5>
                  <p className="small text-muted mb-4 text-center">
                    Gambaran posisi menu favorit di halaman depan pengunjung.
                  </p>

                  <div className="orbit-preview-container mx-auto position-relative">
                    {[1, 2, 3, 4, 5].map((slotNum) => {
                      const item = favoritList.find((f) => f.slot === slotNum);
                      return (
                        <div
                          key={slotNum}
                          id={`prev-slot-${slotNum}`}
                          className="preview-item"
                          title={`Slot ${slotNum}`}
                        >
                          <div className={`prev-img-wrap ${item?.gambar ? 'filled' : ''}`}>
                            <img
                              src={item?.gambar || '/img/Web-Icon/Papeda-icon.png'}
                              alt={item?.nama_makanan || `Slot ${slotNum}`}
                            />
                          </div>
                          <span className="prev-label">Slot {slotNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KELOLA KONTEN & PREVIEW */}
        {activeTab === 'konten' && (
          <div>
            <h1 className="fs-3 fw-bold mb-3">Kelola Konten & Live Preview</h1>
            <p className="text-muted mb-4">
              Ubah teks hero banner dan bagian Tentang Kami. Preview di kanan memakai tampilan asli halaman user,
              jadi hasilnya sama persis setelah disimpan.
            </p>

            <div className="row g-4 align-items-start">
              <div className="col-xl-4">
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
              </div>

              <div className="col-xl-8">
                <div className="card shadow-sm border-0 overflow-hidden sticky-top" style={{ top: '20px' }}>
                  <div className="preview-bar">
                    <span><i className="fa-solid fa-eye me-2"></i> Preview Tampilan User</span>
                    <span className="badge">Real-time</span>
                  </div>
                  <KontenPreview teksHero={kontenWeb.teks_hero} teksAbout={kontenWeb.teks_about} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FOOTER */}
        {activeTab === 'footer' && (
          <div>
            <h1 className="fs-3 fw-bold mb-3">Kelola Konten Footer</h1>
            <p className="text-muted mb-4">
              Preview footer di bawah form memakai komponen footer yang sama dengan halaman user.
            </p>

            <div className="row g-4 align-items-start">
              <div className="col-xl-5">
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
              </div>

              <div className="col-xl-7">
                <div className="card shadow-sm border-0 overflow-hidden sticky-top" style={{ top: '20px' }}>
                  <div className="preview-bar">
                    <span><i className="fa-solid fa-eye me-2"></i> Preview Footer</span>
                    <span className="badge">Real-time</span>
                  </div>
                  <FooterPreview data={footerData} />
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
            <div className="card shadow-sm border-0 p-4 mb-4">
              <h1 className="fs-4 fw-bold mb-4">Kelola User &amp; Reservasi</h1>

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
                                <small>{r.jam || ''}{r.sesi ? ` (${r.sesi})` : ''}</small>
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

            {/* RESERVASI KONFIRMASI */}
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

        {/* TAB 9: FAQ */}
        {activeTab === 'faq' && (
          <div>
            <h1 className="fs-3 fw-bold mb-4">Kelola FAQ</h1>
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
                  <li key={f.id} className="list-group-item d-flex justify-content-between align-items-start">
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
          </div>
        )}
      </main>
    </div>
  );
}
