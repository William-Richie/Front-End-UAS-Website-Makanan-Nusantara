'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

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

  const [pendapatanData, setPendapatanData] = useState<PendapatanSummary | null>(null);
  const [pendapatanRange, setPendapatanRange] = useState<string>('7');

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

  // Cek sesi login admin
  useEffect(() => {
    const adminSession = localStorage.getItem('papeda_admin_logged');
    if (adminSession === 'true') {
      const timer = setTimeout(() => setIsLoggedIn(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadAllData = async () => {
    try {
      fetch('/api/menu').then((r) => r.json()).then((d) => setMenus(d.data || []));
      fetch('/api/pesanan').then((r) => r.json()).then((d) => setPesananList(d.data || []));
      fetch('/api/faq').then((r) => r.json()).then((d) => setFaqList(d.data || []));
      fetch('/api/faq/pertanyaan').then((r) => r.json()).then((d) => setPertanyaanList(d.data || []));
      fetch('/api/reservasi').then((r) => r.json()).then((d) => setReservasiList(d.data || []));
      fetch('/api/pengunjung').then((r) => r.json()).then((d) => setStatistik(d.data || d));
      fetch('/api/favorit').then((r) => r.json()).then((d) => setFavoritList(d.data || []));
      fetch('/api/konten').then((r) => r.json()).then((d) => {
        if (d.data || d) setKontenWeb((prev) => ({ ...prev, ...(d.data || d) }));
      });
      fetch('/api/footer').then((r) => r.json()).then((d) => {
        if (d.data || d) setFooterData(d.data || d);
      });
      fetch(`/api/pendapatan?range=${pendapatanRange}`)
        .then((r) => r.json())
        .then((d) => setPendapatanData(d));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadAllData();
    }
  }, [isLoggedIn, pendapatanRange]);

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
    <div className="d-flex vh-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar text-white p-3 d-flex flex-column shadow-sm" style={{ width: '260px', backgroundColor: '#3b2314' }}>
        <h2 className="text-center mb-4 fs-4 fw-bold mt-2">Admin Papeda</h2>
        <ul className="nav nav-pills flex-column mb-auto">
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
      <main className="flex-grow-1 p-4 overflow-auto bg-light">
        {/* TAB 1: STATISTIK */}
        {activeTab === 'statistik' && (
          <div>
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
          </div>
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

            {pendapatanData && (
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
              Ubah teks hero banner & bagian Tentang Kami, hasil perubahannya langsung terlihat pada live preview di sebelah kanan.
            </p>

            <div className="row g-4 align-items-start">
              {/* Form Input Konten */}
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 p-4">
                  <form onSubmit={handleSaveKonten}>
                    {/* Hero Banner Form */}
                    <div className="mb-4">
                      <h5 className="fw-bold border-bottom pb-2 mb-3">
                        <i className="fa-solid fa-bullhorn me-2 text-warning"></i>Hero Banner
                      </h5>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Teks Eyebrow (Atas Judul)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={kontenWeb.hero_eyebrow || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, hero_eyebrow: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Teks Sambutan (Judul Hero)</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={kontenWeb.teks_hero || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, teks_hero: e.target.value })}
                        />
                        <small className="text-muted">Gunakan tombol Enter untuk baris baru.</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Sub-judul / Deskripsi Hero</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={kontenWeb.hero_sub || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, hero_sub: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Tentang Kami Form */}
                    <div className="mb-4">
                      <h5 className="fw-bold border-bottom pb-2 mb-3">
                        <i className="fa-solid fa-circle-info me-2 text-warning"></i>Tentang Kami
                      </h5>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Teks Eyebrow Tentang Kami</label>
                        <input
                          type="text"
                          className="form-control"
                          value={kontenWeb.about_eyebrow || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, about_eyebrow: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Judul Tentang Kami</label>
                        <input
                          type="text"
                          className="form-control"
                          value={kontenWeb.about_title || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, about_title: e.target.value })}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Deskripsi Tentang Kami</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={kontenWeb.teks_about || ''}
                          onChange={(e) => setKontenWeb({ ...kontenWeb, teks_about: e.target.value })}
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-warning text-white fw-bold w-100 py-2">
                      Simpan Perubahan Konten
                    </button>
                  </form>
                </div>
              </div>

              {/* Preview Tampilan Web User */}
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 overflow-hidden sticky-top" style={{ top: '20px' }}>
                  <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                    <span>
                      <i className="fa-solid fa-eye me-2"></i> Preview Tampilan User
                    </span>
                    <span className="badge bg-success small">Real-time</span>
                  </div>

                  <div className="card-body p-0">
                    {/* Hero Preview */}
                    <div className="hero-papeda p-4 position-relative overflow-hidden">
                      <div className="row align-items-center g-3">
                        <div className="col-7">
                          <p className="hero-eyebrow mb-1 small">{kontenWeb.hero_eyebrow}</p>
                          <h4 className="fw-bold mb-2" style={{ whiteSpace: 'pre-line', color: '#4a2c17' }}>
                            {kontenWeb.teks_hero}
                          </h4>
                          <p className="small text-muted mb-3">{kontenWeb.hero_sub}</p>
                          <div className="d-flex gap-2">
                            <span className="btn hero-btn btn-sm">Lihat Menu</span>
                            <span className="btn hero-btn-outline btn-sm">Reservasi</span>
                          </div>
                        </div>
                        <div className="col-5 text-center position-relative">
                          <img
                            src="/img/papeda-icon.png"
                            alt="Papeda"
                            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* About Section Preview */}
                    <div className="p-4 bg-white border-top">
                      <div className="text-center mb-3">
                        <p className="hero-eyebrow mb-1 small">{kontenWeb.about_eyebrow}</p>
                        <h5 className="fw-bold" style={{ color: '#4a2c17' }}>
                          {kontenWeb.about_title}
                        </h5>
                        <p className="small text-muted mb-3">{kontenWeb.teks_about}</p>
                      </div>

                      <div className="row g-2 text-center">
                        <div className="col-4">
                          <div className="p-2 border rounded bg-light">
                            <i className="fa-solid fa-leaf text-success mb-1"></i>
                            <div className="fw-bold small">{kontenWeb.card1_title}</div>
                            <small className="text-muted" style={{ fontSize: '10px' }}>
                              {kontenWeb.card1_desc}
                            </small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 border rounded bg-light">
                            <i className="fa-solid fa-fire text-danger mb-1"></i>
                            <div className="fw-bold small">{kontenWeb.card2_title}</div>
                            <small className="text-muted" style={{ fontSize: '10px' }}>
                              {kontenWeb.card2_desc}
                            </small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 border rounded bg-light">
                            <i className="fa-solid fa-heart text-danger mb-1"></i>
                            <div className="fw-bold small">{kontenWeb.card3_title}</div>
                            <small className="text-muted" style={{ fontSize: '10px' }}>
                              {kontenWeb.card3_desc}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FOOTER */}
        {activeTab === 'footer' && (
          <div>
            <h1 className="fs-3 fw-bold mb-4">Kelola Konten Footer</h1>
            <div className="card shadow-sm border-0 p-4" style={{ maxWidth: '700px' }}>
              <form onSubmit={handleSaveFooter}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Judul Footer</label>
                  <input
                    type="text"
                    className="form-control"
                    value={footerData.judul}
                    onChange={(e) => setFooterData({ ...footerData, judul: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Copyright Teks</label>
                  <input
                    type="text"
                    className="form-control"
                    value={footerData.copyright}
                    onChange={(e) => setFooterData({ ...footerData, copyright: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Tautan WhatsApp</label>
                  <input
                    type="text"
                    className="form-control"
                    value={footerData.link_wa}
                    onChange={(e) => setFooterData({ ...footerData, link_wa: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Tautan Instagram</label>
                  <input
                    type="text"
                    className="form-control"
                    value={footerData.link_ig}
                    onChange={(e) => setFooterData({ ...footerData, link_ig: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Tautan TikTok</label>
                  <input
                    type="text"
                    className="form-control"
                    value={footerData.link_tiktok}
                    onChange={(e) => setFooterData({ ...footerData, link_tiktok: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Email Restoran</label>
                  <input
                    type="email"
                    className="form-control"
                    value={footerData.email}
                    onChange={(e) => setFooterData({ ...footerData, email: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Tautan LinkedIn</label>
                  <input
                    type="text"
                    className="form-control"
                    value={footerData.link_linkedin}
                    onChange={(e) => setFooterData({ ...footerData, link_linkedin: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-warning text-white fw-bold">
                  Simpan Perubahan Footer
                </button>
              </form>
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
                  {pesananList.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td className="fw-bold">{p.nama}</td>
                      <td className="small" style={{ maxWidth: '300px' }}>{p.item}</td>
                      <td>Rp {p.total.toLocaleString('id-ID')}</td>
                      <td><span className="badge bg-warning text-dark">{p.status}</span></td>
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
            <h1 className="fs-3 fw-bold mb-4">Daftar Reservasi Meja</h1>
            <div className="card shadow-sm border-0 p-3">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>Gerai</th>
                    <th>Tanggal & Jam</th>
                    <th>Jumlah</th>
                    <th>Ruangan</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasiList.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="fw-bold">{r.nama}</div>
                        <small className="text-muted">{r.telepon}</small>
                      </td>
                      <td>{r.gerai}</td>
                      <td>{r.tanggal} - {r.jam}</td>
                      <td>{r.jumlah} orang</td>
                      <td>{r.ruangan}</td>
                      <td><span className="badge bg-info text-dark">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
