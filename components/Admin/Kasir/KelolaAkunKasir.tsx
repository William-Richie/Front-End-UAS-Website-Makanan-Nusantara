'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { BranchMap } from '@/components/User/Reservation/ReservationSection';
import { ambilDaftar } from '@/lib/adminApi';
import type { KasirFilter, KasirItem } from './types';
import './KelolaAkunKasir.css';

const WARNA = [
  ['#8b5e34', '#d9ae78'],
  ['#4a2c17', '#9b6b3f'],
  ['#2f7d5b', '#7cc3a0'],
  ['#a4553a', '#e5997a'],
  ['#4f6b8f', '#9db8da'],
  ['#7a4a6b', '#c996ba'],
];
const gradienKasir = (nama: string) => {
  const t = Array.from(nama || '?').reduce((a, c) => a + c.charCodeAt(0), 0);
  const [a, b] = WARNA[t % WARNA.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

const FORM_KOSONG = { nama: '', username: '', password: '', gerai: '' };

interface KelolaAkunKasirProps {
  branches: BranchMap[];
}

export default function KelolaAkunKasir({ branches }: KelolaAkunKasirProps) {
  const [kasirList, setKasirList] = useState<KasirItem[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [kasirForm, setKasirForm] = useState(FORM_KOSONG);
  const [showKasirPass, setShowKasirPass] = useState(false);
  const [showKasirForm, setShowKasirForm] = useState(false);
  const [kasirCari, setKasirCari] = useState('');
  const [kasirFilter, setKasirFilter] = useState<KasirFilter>('semua');

  const loadKasir = useCallback(
    () =>
      ambilDaftar<KasirItem>('/api/admin/cashier').then((d) => {
        setKasirList(d);
        setMemuat(false);
      }),
    []
  );

  useEffect(() => {
    loadKasir();
  }, [loadKasir]);

  // Akun Kasir (satu akun kasir hanya terhubung ke satu gerai)
  const handleAddKasir = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/cashier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kasirForm),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        alert(d?.error || 'Gagal membuat akun kasir.');
        return;
      }
      setKasirForm(FORM_KOSONG);
      setShowKasirForm(false);
      loadKasir();
    } catch {
      alert('Gagal membuat akun kasir.');
    }
  };

  const ubahKasir = async (body: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/admin/cashier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) alert(d?.error || 'Gagal memperbarui akun kasir.');
    } catch {
      alert('Gagal memperbarui akun kasir.');
    }
    loadKasir();
  };

  const handleGantiGeraiKasir = (k: KasirItem, geraiBaru: string) => {
    if (geraiBaru === k.gerai) return;
    if (!confirm(`Pindahkan kasir ${k.nama} ke gerai ${geraiBaru}?`)) return;
    ubahKasir({ id: k.id, gerai: geraiBaru });
  };

  const handleResetPasswordKasir = (k: KasirItem) => {
    const baru = prompt(`Password baru untuk ${k.username} (minimal 6 karakter):`);
    if (baru === null || baru === '') return;
    ubahKasir({ id: k.id, password: baru });
  };

  const handleDeleteKasir = async (k: KasirItem) => {
    if (!confirm(`Hapus akun kasir ${k.nama}?`)) return;
    const res = await fetch('/api/admin/cashier', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: k.id }),
    });
    if (!res.ok) alert('Gagal menghapus akun kasir.');
    loadKasir();
  };

  const q = kasirCari.trim().toLowerCase();
    const jumlahAktif = kasirList.filter((k) => k.is_active).length;
    const jumlahNonaktif = kasirList.length - jumlahAktif;
    const tampil = kasirList.filter(
      (k) =>
        (kasirFilter === 'semua' || (kasirFilter === 'aktif') === k.is_active) &&
        (!q || k.nama.toLowerCase().includes(q) || k.username.toLowerCase().includes(q))
    );
    const tab = [
      { key: 'semua', label: 'Semua', n: kasirList.length },
      { key: 'aktif', label: 'Aktif', n: jumlahAktif },
      { key: 'nonaktif', label: 'Nonaktif', n: jumlahNonaktif },
    ] as const;


    return (
      <div className="kx-page">
        {/* Banner */}
        <div className="kx-hero">
          <div className="kx-hero-top">
            <div className="kx-hero-text">
              <div className="kx-hero-icon">
                <i className="fa-solid fa-user-lock"></i>
              </div>
              <div>
                <div className="kx-title" role="heading" aria-level={1}>Kelola Akun Kasir</div>
                <p className="kx-sub">
                  Setiap kasir hanya bisa mengakses satu gerai
                </p>
              </div>
            </div>
            <button type="button" className="kx-add" onClick={() => setShowKasirForm(true)}>
              <i className="fa-solid fa-plus"></i>Tambah kasir
            </button>
          </div>

          <div className="kx-stats">
            <div className="kx-stat">
              <span className="kx-stat-icon"><i className="fa-solid fa-users"></i></span>
              <div>
                <strong>{kasirList.length}</strong>
                <span>Total kasir</span>
              </div>
            </div>
            <div className="kx-stat">
              <span className="kx-stat-icon"><i className="fa-solid fa-user-check"></i></span>
              <div>
                <strong>{jumlahAktif}</strong>
                <span>Aktif</span>
              </div>
            </div>
            <div className="kx-stat">
              <span className="kx-stat-icon"><i className="fa-solid fa-user-slash"></i></span>
              <div>
                <strong>{jumlahNonaktif}</strong>
                <span>Nonaktif</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & cari */}
        <div className="kx-toolbar">
          <div className="kx-tabs" role="tablist">
            {tab.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={kasirFilter === t.key}
                className={`kx-tab ${kasirFilter === t.key ? 'on' : ''}`}
                onClick={() => setKasirFilter(t.key)}
              >
                {t.label}
                <em>{t.n}</em>
              </button>
            ))}
          </div>
          <div className="kx-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              placeholder="Cari nama atau username"
              value={kasirCari}
              onChange={(e) => setKasirCari(e.target.value)}
            />
          </div>
        </div>

        {/* Daftar akun kasir */}
        {memuat ? (
          <div className="kx-empty">
            <div className="kx-empty-icon">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>
            <strong>Memuat akun kasir…</strong>
          </div>
        ) : tampil.length === 0 ? (
          <div className="kx-empty">
            <div className="kx-empty-icon">
              <i className={`fa-solid ${kasirList.length === 0 ? 'fa-user-plus' : 'fa-magnifying-glass'}`}></i>
            </div>
            <strong>{kasirList.length === 0 ? 'Belum ada akun kasir' : 'Tidak ada kasir yang cocok'}</strong>
            <span>
              {kasirList.length === 0
                ? 'Buat akun pertama agar kasir bisa login ke halaman kasir.'
                : 'Coba ganti filter atau kata kunci pencarian.'}
            </span>
            {kasirList.length === 0 && (
              <button type="button" className="kx-add dark" onClick={() => setShowKasirForm(true)}>
                <i className="fa-solid fa-plus"></i>Tambah kasir
              </button>
            )}
          </div>
        ) : (
          <div className="kx-grid">
            {tampil.map((k) => (
              <article key={k.id} className={`kx-card ${k.is_active ? '' : 'is-off'}`}>
                <div className="kx-strip" style={{ background: gradienKasir(k.nama) }}></div>
                <span className={`kx-pill ${k.is_active ? 'on' : ''}`}>
                  <span className="kx-pill-dot"></span>
                  {k.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
                <div className="kx-avatar" style={{ background: gradienKasir(k.nama) }}>
                  {(k.nama || '?').trim().charAt(0).toUpperCase()}
                </div>

                <div className="kx-body">
                  <div className="kx-name">{k.nama}</div>
                  <div className="kx-user">@{k.username}</div>
                  <label className="kx-gerai" title="Ubah gerai kasir">
                    <i className="fa-solid fa-store"></i>
                    <select
                      className="kx-select"
                      value={k.gerai}
                      onChange={(e) => handleGantiGeraiKasir(k, e.target.value)}
                      aria-label={`Gerai ${k.nama}`}
                    >
                      {!branches.some((b) => b.nama === k.gerai) && <option value={k.gerai}>{k.gerai}</option>}
                      {branches.map((b) => (
                        <option key={b.id} value={b.nama}>
                          {b.nama}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="kx-actions">
                  <button
                    type="button"
                    className="kx-act"
                    onClick={() => ubahKasir({ id: k.id, is_active: !k.is_active })}
                  >
                    <i className={`fa-solid ${k.is_active ? 'fa-ban' : 'fa-circle-check'}`}></i>
                    <span>{k.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </button>
                  <button type="button" className="kx-act" onClick={() => handleResetPasswordKasir(k)}>
                    <i className="fa-solid fa-key"></i>
                    <span>Password</span>
                  </button>
                  <button type="button" className="kx-act danger" onClick={() => handleDeleteKasir(k)}>
                    <i className="fa-solid fa-trash"></i>
                    <span>Hapus</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pop-up tambah akun kasir */}
        {showKasirForm && (
          <div className="kx-backdrop" onClick={() => setShowKasirForm(false)}>
            <div
              className="kx-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="kx-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kx-modal-head">
                <div className="kx-modal-icon">
                  <i className="fa-solid fa-user-plus"></i>
                </div>
                <div>
                  <div id="kx-modal-title" className="kx-modal-title">Tambah kasir baru</div>
                  <p className="kx-modal-sub">Kasir hanya bisa memakai satu gerai yang kamu pilih di sini.</p>
                </div>
                <button
                  type="button"
                  className="kx-modal-close"
                  onClick={() => setShowKasirForm(false)}
                  aria-label="Tutup"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form className="kx-form" onSubmit={handleAddKasir}>
                <div className="kx-modal-body">
                  <div className="kx-field">
                    <label htmlFor="kasir-nama">Nama kasir</label>
                    <input
                      id="kasir-nama"
                      className="form-control"
                      placeholder="Contoh: Kasir Gerai X"
                      value={kasirForm.nama}
                      onChange={(e) => setKasirForm({ ...kasirForm, nama: e.target.value })}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="kx-field">
                    <label htmlFor="kasir-username">Username</label>
                    <input
                      id="kasir-username"
                      className="form-control"
                      placeholder="Dipakai untuk login"
                      value={kasirForm.username}
                      onChange={(e) => setKasirForm({ ...kasirForm, username: e.target.value })}
                      autoComplete="off"
                      required
                    />
                  </div>
                  <div className="kx-field">
                    <label htmlFor="kasir-password">Password</label>
                    <div className="kx-pass">
                      <input
                        id="kasir-password"
                        className="form-control"
                        type={showKasirPass ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        value={kasirForm.password}
                        onChange={(e) => setKasirForm({ ...kasirForm, password: e.target.value })}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="kx-pass-btn"
                        onClick={() => setShowKasirPass((v) => !v)}
                        aria-label={showKasirPass ? 'Sembunyikan password' : 'Tampilkan password'}
                        title={showKasirPass ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        <i className={`fa-solid ${showKasirPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="kx-field wide">
                    <label>Pilih gerai</label>
                    <div className="kx-chips" role="radiogroup" aria-label="Gerai">
                      {branches.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          role="radio"
                          aria-checked={kasirForm.gerai === b.nama}
                          className={`kx-chip ${kasirForm.gerai === b.nama ? 'on' : ''}`}
                          onClick={() => setKasirForm({ ...kasirForm, gerai: b.nama })}
                        >
                          <i className="fa-solid fa-store"></i>
                          {b.nama}
                        </button>
                      ))}
                      {branches.length === 0 && (
                        <span className="kx-hint">Belum ada gerai. Tambahkan gerai terlebih dahulu.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="kx-form-actions">
                  <button type="button" className="kx-ghost" onClick={() => setShowKasirForm(false)}>
                    Batal
                  </button>
                  <button type="submit" className="kx-add dark" disabled={!kasirForm.gerai}>
                    <i className="fa-solid fa-check"></i>Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
}
