'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { BranchMap } from '@/components/User/Reservation/ReservationSection';
import { namaSingkatGerai } from '@/lib/gerai';
import type { ModeTanggal, PesananFilterKey, PesananItem } from './types';
import {
  PESANAN_FILTER,
  PESANAN_LABEL,
  PESANAN_PER_HALAMAN,
  bacaPesanan,
  cocokFilterPesanan,
  geserHari,
  labelTanggal,
  tglPesanan,
  waktuPesanan,
} from './pesananUtils';
import './PantauPesanan.css';

const KEY_GERAI = 'papeda_admin_gerai';

interface PantauPesananProps {
  pesananList: PesananItem[];
  branches: BranchMap[];
  onRefresh: () => void;
}

export default function PantauPesanan({ pesananList, branches, onRefresh }: PantauPesananProps) {
  const [filterPesanan, setFilterPesanan] = useState<PesananFilterKey>('aktif');
  const [cariPesanan, setCariPesanan] = useState('');
  const [modeTgl, setModeTgl] = useState<ModeTanggal>('semua');
  const [tglDari, setTglDari] = useState('');
  const [tglSampai, setTglSampai] = useState('');
  const [geraiPesanan, setGeraiPesanan] = useState(() =>
    typeof window === 'undefined' ? 'semua' : localStorage.getItem(KEY_GERAI) || 'semua'
  );
  const [geraiTerbuka, setGeraiTerbuka] = useState(false);
  const geraiRef = useRef<HTMLDivElement>(null);
  const [batasPesanan, setBatasPesanan] = useState(PESANAN_PER_HALAMAN);

  useEffect(() => {
    if (!geraiTerbuka) return;
    const klik = (e: MouseEvent) => {
      if (geraiRef.current && !geraiRef.current.contains(e.target as Node)) setGeraiTerbuka(false);
    };
    const tombol = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGeraiTerbuka(false);
    };
    document.addEventListener('mousedown', klik);
    document.addEventListener('keydown', tombol);
    return () => {
      document.removeEventListener('mousedown', klik);
      document.removeEventListener('keydown', tombol);
    };
  }, [geraiTerbuka]);

  const cocokTanggal = (p: PesananItem) => {
    if (modeTgl === 'semua' || !tglDari) return true;
    const t = tglPesanan(p.created_at);
    if (modeTgl === 'hari') return t === tglDari;
    const ujung = tglSampai || tglDari;
    const awal = tglDari < ujung ? tglDari : ujung;
    const akhir = tglDari < ujung ? ujung : tglDari;
    return t >= awal && t <= akhir;
  };

  const handleHapusPesanan = async (id: number) => {
    if (!confirm(`Hapus pesanan #${id} secara permanen?`)) return;
    await fetch(`/api/pesanan/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleHapusSemuaDibatalkan = async (daftarId: number[], namaGerai: string) => {
    if (daftarId.length === 0) return;
    if (!confirm(`Hapus ${daftarId.length} pesanan yang dibatalkan${namaGerai} secara permanen?`)) return;
    await Promise.all(daftarId.map((id) => fetch(`/api/pesanan/${id}`, { method: 'DELETE' })));
    onRefresh();
  };

    const kata = cariPesanan.trim().toLowerCase();
    const namaGeraiPesanan = (p: PesananItem) => bacaPesanan(p.item).gerai;
    const geraiDikenal = (nama: string) => branches.some((b) => b.nama === nama);
    const cocokGerai = (p: PesananItem) =>
      geraiPesanan === 'semua' ||
      (geraiPesanan === '__lain' ? !geraiDikenal(namaGeraiPesanan(p)) : namaGeraiPesanan(p) === geraiPesanan);
    const pesananGerai = pesananList.filter((p) => cocokGerai(p) && cocokTanggal(p));
    const tersaring = pesananGerai.filter(
      (p) =>
        cocokFilterPesanan(p, filterPesanan) &&
        (!kata || String(p.id).includes(kata.replace('#', '')) || p.nama.toLowerCase().includes(kata))
    );
    const tampil = tersaring.slice(0, batasPesanan);
    const dibatalkanGerai = pesananGerai.filter((p) => p.status === 'dibatalkan');
    const jumlahDibatalkan = dibatalkanGerai.length;
    const aktifPerGerai = (cocok: (p: PesananItem) => boolean) =>
      pesananList.filter((p) => cocok(p) && cocokFilterPesanan(p, 'aktif')).length;
    const adaGeraiLain = pesananList.some((p) => !geraiDikenal(namaGeraiPesanan(p)));
    const pilihGerai = (key: string) => {
      setGeraiPesanan(key);
      setBatasPesanan(PESANAN_PER_HALAMAN);
      localStorage.setItem(KEY_GERAI, key);
      setGeraiTerbuka(false);
    };
    const opsiGerai = [
      { key: 'semua', label: 'Semua Gerai', ikon: 'fa-layer-group', aktif: aktifPerGerai(() => true) },
      ...branches.map((b) => ({
        key: b.nama,
        label: namaSingkatGerai(b.nama),
        ikon: 'fa-store',
        aktif: aktifPerGerai((p) => namaGeraiPesanan(p) === b.nama),
      })),
      ...(adaGeraiLain
        ? [{ key: '__lain', label: 'Gerai Lama', ikon: 'fa-circle-question', aktif: aktifPerGerai((p) => !geraiDikenal(namaGeraiPesanan(p))) }]
        : []),
    ];
    const geraiTerpilih = opsiGerai.find((o) => o.key === geraiPesanan) || {
      key: geraiPesanan,
      label: namaSingkatGerai(geraiPesanan),
      ikon: 'fa-store',
      aktif: 0,
    };
    const labelGerai =
      (geraiPesanan === 'semua' ? '' : geraiPesanan === '__lain' ? ' (gerai lama)' : ` di ${namaSingkatGerai(geraiPesanan)}`) +
      (modeTgl !== 'semua' && tglDari
        ? modeTgl === 'hari' || !tglSampai || tglSampai === tglDari
          ? ` pada ${labelTanggal(tglDari)}`
          : ` pada ${labelTanggal(tglDari)} – ${labelTanggal(tglSampai)}`
        : '');
    const tanggalAktif = modeTgl !== 'semua' && !!tglDari;
    const pilihMode = (m: ModeTanggal) => {
      setModeTgl(m);
      setBatasPesanan(PESANAN_PER_HALAMAN);
      if (m !== 'semua' && !tglDari) {
        const h = geserHari(0);
        setTglDari(h);
        setTglSampai(h);
      }
      if (m === 'hari') setTglSampai(tglDari || geserHari(0));
    };
    const setCepat = (dari: string, sampai: string, mode: ModeTanggal) => {
      setModeTgl(mode);
      setTglDari(dari);
      setTglSampai(sampai);
      setBatasPesanan(PESANAN_PER_HALAMAN);
    };
    const pindahFilter = (key: PesananFilterKey) => {
      setFilterPesanan(key);
      setBatasPesanan(PESANAN_PER_HALAMAN);
    };


    return (
      <div>
        <div className="order-head">
          <div>
            <h1 className="fs-3 fw-bold mb-1">Pantau Pesanan</h1>
            <p className="order-sub mb-0">
              <span className="order-live"></span> Diperbarui otomatis tiap 5 detik
            </p>
          </div>
          <div className="order-tools">
            <Link href="/cashier" target="_blank" className="btn btn-outline-secondary fw-bold">
              <i className="fa-solid fa-cash-register me-2"></i>Buka Halaman Kasir
            </Link>
            <div className="order-gerai" ref={geraiRef}>
              <button
                type="button"
                className={`order-gerai-btn ${geraiTerbuka ? 'open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={geraiTerbuka}
                onClick={() => setGeraiTerbuka((o) => !o)}
              >
                <i className={`fa-solid ${geraiTerpilih.ikon} order-gerai-ico`}></i>
                <span className="order-gerai-txt">
                  <small>Gerai</small>
                  <strong>{geraiTerpilih.label}</strong>
                </span>
                {geraiTerpilih.aktif > 0 && <b className="order-gerai-n">{geraiTerpilih.aktif}</b>}
                <i className="fa-solid fa-chevron-down order-gerai-arrow"></i>
              </button>
              {geraiTerbuka && (
                <ul className="order-gerai-list" role="listbox">
                  {opsiGerai.map((o) => (
                    <li key={o.key} role="option" aria-selected={geraiPesanan === o.key}>
                      <button
                        type="button"
                        className={`order-gerai-opt ${geraiPesanan === o.key ? 'active' : ''}`}
                        title={o.key === '__lain' ? 'Pesanan yang nama gerainya sudah tidak ada di daftar gerai' : undefined}
                        onClick={() => pilihGerai(o.key)}
                      >
                        <i className={`fa-solid ${o.ikon}`}></i>
                        <span>{o.label}</span>
                        <em>{o.aktif} aktif</em>
                        <i className="fa-solid fa-check order-gerai-check"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="order-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Cari nama atau nomor pesanan"
                value={cariPesanan}
                onChange={(e) => {
                  setCariPesanan(e.target.value);
                  setBatasPesanan(PESANAN_PER_HALAMAN);
                }}
              />
            </div>
          </div>
        </div>

        <div className="order-date" role="group" aria-label="Filter tanggal">
          <div className="order-date-mode" role="tablist">
            {([
              ['semua', 'Semua tanggal'],
              ['hari', 'Satu hari'],
              ['rentang', 'Rentang'],
            ] as [ModeTanggal, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={modeTgl === key}
                className={modeTgl === key ? 'active' : ''}
                onClick={() => pilihMode(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {modeTgl === 'hari' && (
            <label className="order-date-field">
              <i className="fa-regular fa-calendar"></i>
              <input
                type="date"
                value={tglDari}
                max={geserHari(0)}
                onChange={(e) => {
                  setTglDari(e.target.value);
                  setTglSampai(e.target.value);
                  setBatasPesanan(PESANAN_PER_HALAMAN);
                }}
                aria-label="Tanggal pesanan"
              />
            </label>
          )}

          {modeTgl === 'rentang' && (
            <div className="order-date-range">
              <label className="order-date-field">
                <small>Dari</small>
                <input
                  type="date"
                  value={tglDari}
                  max={tglSampai || geserHari(0)}
                  onChange={(e) => {
                    setTglDari(e.target.value);
                    setBatasPesanan(PESANAN_PER_HALAMAN);
                  }}
                  aria-label="Dari tanggal"
                />
              </label>
              <span className="order-date-sep">–</span>
              <label className="order-date-field">
                <small>Sampai</small>
                <input
                  type="date"
                  value={tglSampai}
                  min={tglDari || undefined}
                  max={geserHari(0)}
                  onChange={(e) => {
                    setTglSampai(e.target.value);
                    setBatasPesanan(PESANAN_PER_HALAMAN);
                  }}
                  aria-label="Sampai tanggal"
                />
              </label>
            </div>
          )}

          {modeTgl !== 'semua' && (
            <div className="order-date-quick">
              <button type="button" onClick={() => setCepat(geserHari(0), geserHari(0), 'hari')}>Hari ini</button>
              <button type="button" onClick={() => setCepat(geserHari(-1), geserHari(-1), 'hari')}>Kemarin</button>
              <button type="button" onClick={() => setCepat(geserHari(-6), geserHari(0), 'rentang')}>7 hari</button>
              <button type="button" onClick={() => setCepat(geserHari(-29), geserHari(0), 'rentang')}>30 hari</button>
            </div>
          )}
        </div>

        <div className="reservation-tabs order-tabs">
          {PESANAN_FILTER.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`tab-btn ${filterPesanan === key ? 'active' : ''}`}
              onClick={() => pindahFilter(key)}
            >
              {label}
              <span className="badge">{pesananGerai.filter((p) => cocokFilterPesanan(p, key)).length}</span>
            </button>
          ))}
        </div>

        {filterPesanan === 'dibatalkan' && jumlahDibatalkan > 0 && (
          <div className="order-clean">
            <span>
              <i className="fa-solid fa-circle-info me-2"></i>
              Pesanan yang dibatalkan tidak dipakai di laporan, aman untuk dihapus.
            </span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleHapusSemuaDibatalkan(dibatalkanGerai.map((p) => p.id), labelGerai)}>
              <i className="fa-solid fa-trash-can me-2"></i>Hapus Semua ({jumlahDibatalkan})
            </button>
          </div>
        )}

        {tersaring.length === 0 ? (
          <div className="order-empty">
            <i className="fa-solid fa-receipt"></i>
            <p className="mb-0">
              {kata
                ? 'Tidak ada pesanan yang cocok dengan pencarian.'
                : tanggalAktif
                  ? 'Tidak ada pesanan di kategori ini pada tanggal yang dipilih.'
                  : 'Belum ada pesanan di kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="order-grid">
            {tampil.map((p) => {
              const info = bacaPesanan(p.item);
              const tampilMenu = info.menu.slice(0, 3);
              const sisaMenu = info.menu.length - tampilMenu.length;
              return (
                <div key={p.id} className={`order-card status-${p.status}`}>
                  <div className="order-card-top">
                    <div>
                      <div className="order-id">#{p.id}</div>
                      <div className="order-time">{waktuPesanan(p.created_at)}</div>
                    </div>
                    <span className={`order-status status-${p.status}`}>{PESANAN_LABEL[p.status] || p.status}</span>
                  </div>

                  <div className="order-name">{p.nama}</div>
                  <div className="order-chips">
                    {info.metode && (
                      <span className="order-chip">
                        <i className={`fa-solid ${info.antar ? 'fa-motorcycle' : 'fa-utensils'}`}></i>
                        {info.metode}
                      </span>
                    )}
                    {info.gerai && geraiPesanan === 'semua' && (
                      <span className="order-chip">
                        <i className="fa-solid fa-location-dot"></i>
                        {namaSingkatGerai(info.gerai)}
                      </span>
                    )}
                    {info.bayar && (
                      <span className={`order-chip ${info.lunas ? 'paid' : ''}`}>
                        <i className={`fa-solid ${info.lunas ? 'fa-circle-check' : 'fa-clock'}`}></i>
                        {info.bayar}
                        {info.lunas ? ' • Lunas' : ''}
                      </span>
                    )}
                  </div>

                  <ul className="order-items">
                    {info.teks && <li>{info.teks}</li>}
                    {tampilMenu.map((m, i) => (
                      <li key={i}>
                        <span>{m.nama}</span>
                        <b>x{m.qty}</b>
                      </li>
                    ))}
                    {sisaMenu > 0 && <li className="more">+{sisaMenu} menu lainnya</li>}
                  </ul>

                  <div className="order-card-bottom">
                    <div className="order-total">
                      <small>Total</small>
                      Rp {Number(p.total || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="order-actions">
                      {p.status === 'dibatalkan' && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleHapusPesanan(p.id)}>
                          <i className="fa-solid fa-trash-can me-2"></i>Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tersaring.length > tampil.length && (
          <div className="order-more">
            <button type="button" className="btn btn-outline-secondary" onClick={() => setBatasPesanan((b) => b + PESANAN_PER_HALAMAN)}>
              Tampilkan lebih banyak ({tersaring.length - tampil.length} lagi)
            </button>
          </div>
        )}
      </div>
    );
}
