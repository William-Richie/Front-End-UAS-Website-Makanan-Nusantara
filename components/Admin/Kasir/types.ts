export type KasirItem = {
  id: string;
  nama: string;
  username: string;
  gerai: string;
  is_active: boolean;
  created_at: string;
};

export type KasirFilter = 'semua' | 'aktif' | 'nonaktif';
