export const MODE_ORBIT = [
  { nilai: 'manual', label: 'Pilih Manual' },
  { nilai: 'terlaris', label: 'Otomatis (Terlaris)' },
] as const;

export const GERAK_ORBIT = [
  { nilai: 'bertahap', label: 'Bertahap' },
  { nilai: 'halus', label: 'Berputar Halus' },
  { nilai: 'diam', label: 'Diam' },
] as const;

export const KECEPATAN_ORBIT = [
  { nilai: 'lambat', label: 'Lambat', detik: 30 },
  { nilai: 'normal', label: 'Normal', detik: 20 },
  { nilai: 'cepat', label: 'Cepat', detik: 12 },
] as const;

export const BENTUK_ORBIT = [
  { nilai: 'lingkaran', label: 'Lingkaran' },
  { nilai: 'rounded', label: 'Kotak Membulat' },
  { nilai: 'kotak', label: 'Kotak' },
  { nilai: 'daun', label: 'Daun' },
  { nilai: 'telur', label: 'Telur' },
] as const;

export const PALET_ORBIT = [
  { nama: 'Putih', hex: '#ffffff' },
  { nama: 'Cokelat Muda', hex: '#c9a17a' },
  { nama: 'Emas Hangat', hex: '#f2c879' },
  { nama: 'Terracotta', hex: '#c9622a' },
  { nama: 'Oranye Bata', hex: '#b5532d' },
  { nama: 'Merah Cabai', hex: '#c0392b' },
  { nama: 'Cokelat Papeda', hex: '#4a2c17' },
] as const;

export type OrbitMode = (typeof MODE_ORBIT)[number]['nilai'];
export type OrbitGerak = (typeof GERAK_ORBIT)[number]['nilai'];
export type OrbitKecepatan = (typeof KECEPATAN_ORBIT)[number]['nilai'];
export type OrbitBentuk = (typeof BENTUK_ORBIT)[number]['nilai'];

export interface OrbitSetting {
  mode: OrbitMode;
  gerak: OrbitGerak;
  kecepatan: OrbitKecepatan;
  bentuk: OrbitBentuk;
  warna: string;
}

export const ORBIT_DEFAULT: OrbitSetting = {
  mode: 'manual',
  gerak: 'bertahap',
  kecepatan: 'normal',
  bentuk: 'lingkaran',
  warna: '#ffffff',
};

const pilih = <T extends string>(nilai: unknown, daftar: readonly T[], awal: T): T =>
  daftar.includes(nilai as T) ? (nilai as T) : awal;


export function rapikanOrbit(raw?: object | null): OrbitSetting {
  const r = (raw || {}) as Record<string, unknown>;
  const warnaValid = PALET_ORBIT.some((p) => p.hex === r.warna);

  return {
    mode: pilih(r.mode, MODE_ORBIT.map((o) => o.nilai), ORBIT_DEFAULT.mode),
    gerak: pilih(r.gerak, GERAK_ORBIT.map((o) => o.nilai), ORBIT_DEFAULT.gerak),
    kecepatan: pilih(r.kecepatan, KECEPATAN_ORBIT.map((o) => o.nilai), ORBIT_DEFAULT.kecepatan),
    bentuk: pilih(r.bentuk, BENTUK_ORBIT.map((o) => o.nilai), ORBIT_DEFAULT.bentuk),
    warna: warnaValid ? (r.warna as string) : ORBIT_DEFAULT.warna,
  };
}

export const durasiOrbit = (k: OrbitKecepatan): number =>
  KECEPATAN_ORBIT.find((o) => o.nilai === k)?.detik ?? 20;
