import type { PesananFilterKey, PesananItem } from './types';

export const PESANAN_PER_HALAMAN = 9;

export const PESANAN_FILTER: { key: PesananFilterKey; label: string }[] = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'menunggu_bayar', label: 'Menunggu Bayar' },
  { key: 'pending', label: 'Antrian' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'dibatalkan', label: 'Dibatalkan' },
  { key: 'semua', label: 'Semua' },
];

export const PESANAN_LABEL: Record<string, string> = {
  menunggu_bayar: 'Menunggu Bayar',
  pending: 'Antrian',
  diproses: 'Diproses',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export const bacaPesanan = (raw: string) => {
  try {
    const p = JSON.parse(raw);
    const menu: { nama: string; qty: number }[] = Array.isArray(p?.daftar_menu)
      ? p.daftar_menu.map((m: { nama_makanan: string; quantity?: number }) => ({
          nama: m.nama_makanan,
          qty: m.quantity || 1,
        }))
      : [];
    return {
      menu,
      teks: menu.length === 0 ? raw : '',
      metode: p?.metode === 'online' ? 'Pesan Antar' : p?.metode === 'dine-in' ? 'Makan di Tempat' : '',
      antar: p?.metode === 'online',
      gerai: (p?.gerai as string) || '',
      bayar: (p?.metode_bayar as string) || '',
      lunas: p?.status_bayar === 'Lunas',
    };
  } catch {
    return { menu: [], teks: raw, metode: '', antar: false, gerai: '', bayar: '', lunas: false };
  }
};

export const cocokFilterPesanan = (p: PesananItem, key: PesananFilterKey) => {
  if (key === 'semua') return true;
  if (key === 'aktif') return ['menunggu_bayar', 'pending', 'diproses'].includes(p.status);
  return p.status === key;
};

export const waktuPesanan = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}, ${d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export const tglPesanan = (iso: string) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '');

export const labelTanggal = (d: string) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const geserHari = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
};
