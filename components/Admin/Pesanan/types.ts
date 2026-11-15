export interface PesananItem {
  id: number;
  nama: string;
  item: string;
  total: number;
  status: string;
  created_at: string;
}

export type PesananFilterKey = 'aktif' | 'menunggu_bayar' | 'pending' | 'diproses' | 'selesai' | 'dibatalkan' | 'semua';
export type ModeTanggal = 'semua' | 'hari' | 'rentang';
