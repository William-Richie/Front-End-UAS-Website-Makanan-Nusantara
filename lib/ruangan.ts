import prisma from '@/lib/prisma'

export interface DefRuangan {
  kode: string;
  label: string;
  grup: 'Reguler' | 'VIP Room';
  defaultJumlah: number;
}

export const list_ruangan: DefRuangan[] = [
  { kode: 'reguler-indoor',  label: 'Reguler Indoor (No Smoking / AC)', grup: 'Reguler', defaultJumlah: 10 },
  { kode: 'reguler-outdoor', label: 'Reguler Outdoor (Free Smoking)',   grup: 'Reguler', defaultJumlah: 10 },
  { kode: 'vip-10',    label: 'VIP Room 1 (1 Table, Recommended for 4 - 10 people)',         grup: 'VIP Room', defaultJumlah: 1 },
  { kode: 'vip-10-tv', label: 'VIP Room 1 ++ (1 Table + TV, Recommended for 4 - 10 people)', grup: 'VIP Room', defaultJumlah: 1 },
  { kode: 'vip-20',    label: 'VIP Room 2 (2 Table, Recommended for 8 - 20 people)',         grup: 'VIP Room', defaultJumlah: 1 },
  { kode: 'vip-20-tv', label: 'VIP Room 2 ++ (2 Table + TV, Recommended for 8 - 20 people)', grup: 'VIP Room', defaultJumlah: 1 },
];

export const isVip = (kode: string) => kode.startsWith('vip-');

export function buatKunciVip(gerai: string, tanggal: string, sesi: string, ruangan: string): string | null {
  if (!isVip(ruangan)) return null;
  return [gerai, tanggal, sesi, ruangan].join('|');
}

export interface InfoRuangan {
  ruangan: string;
  label: string;
  grup: 'Reguler' | 'VIP Room';
  jumlah: number | null;
  terpakai: number;
  sisa: number | null;
  status: boolean;     
  tersedia: boolean; 
}

const cancel = ['dibatalkan', 'cancelled'];

export async function hitungKetersediaan(
  gerai: string,
  tanggal?: string | null,
  sesi?: string | null
): Promise<InfoRuangan[]> {
  const pengaturan = await prisma.pengaturanRuangan.findMany({ where: { gerai } });

  const mapSet = new Map<string, { jumlah: number | null; status: boolean }>();
  for (const p of pengaturan) mapSet.set(p.ruangan, p);

  const terpakai = new Map<string, number>();
  if (tanggal && sesi) {
    const grup = await prisma.reservasi.groupBy({
      by: ['ruangan'],
      where: { gerai, tanggal, sesi, status: { notIn: cancel } },
      _count: { _all: true },
    });
    for (const g of grup) terpakai.set(g.ruangan, g._count._all);
  }

  return list_ruangan.map((r) => {
    const p = mapSet.get(r.kode);
    const dipakai = terpakai.get(r.kode) ?? 0;

    if (r.grup === 'Reguler') {
      const jumlah = p?.jumlah ?? r.defaultJumlah;
      const sisa = Math.max(0, jumlah - dipakai);
      const status = p?.status ?? true;
      return {
        ruangan: r.kode, label: r.label, grup: r.grup,
        jumlah, terpakai: dipakai, sisa,
        status, tersedia: status && sisa > 0,
      };
    }

    const status = p?.status ?? true;
    return {
      ruangan: r.kode, label: r.label, grup: r.grup,
      jumlah: null, terpakai: dipakai, sisa: null,
      status, tersedia: status && dipakai === 0,
    };
  });
}