export const TIPE_MEJA = ['indoor', 'outdoor', 'vip'] as const;
export type TipeMeja = (typeof TIPE_MEJA)[number];

export const KODE_RUANGAN: Record<TipeMeja, string> = {
  indoor: 'reguler-indoor',
  outdoor: 'reguler-outdoor',
  vip: 'vip',
};

export const TIPE_DARI_KODE: Record<string, TipeMeja> = {
  'reguler-indoor': 'indoor',
  'reguler-outdoor': 'outdoor',
  vip: 'vip',
};

export const INFO_TIPE: Record<TipeMeja, { judul: string; gambar: string }> = {
  indoor: { judul: 'Reguler Indoor (No Smoking / AC)', gambar: '/img/Reservasi/Reguler.webp' },
  outdoor: { judul: 'Reguler Outdoor (Free Smoking)', gambar: '/img/Reservasi/Outdoor.webp' },
  vip: { judul: 'VIP Room', gambar: '/img/Reservasi/VIP.webp' },
};