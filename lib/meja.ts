import prisma from '@/lib/prisma';
import type { TipeMeja } from '@/lib/mejaTipe';

const menit = (j: string) => {
  const [h, m] = j.split(':').map(Number);
  return h * 60 + m;
};
// bentrok kalau selisih kurang dari 60 menit (08:00 mengunci 07:30, 08:00, 08:30)
const bentrok = (a: string, b: string) => Math.abs(menit(a) - menit(b)) < 60;

export async function daftarMeja(gerai: string, tanggal: string, jam: string, tipe?: TipeMeja) {
  const meja = await prisma.meja.findMany({
    where: { gerai, ...(tipe ? { tipe } : {}) },
    orderBy: [{ tipe: 'asc' }, { nomor: 'asc' }],
    include: {
      slots: { where: { OR: [{ tanggal, jam }, { tanggal: '*', jam: '*' }] } },
    },
  });

  const aktif = await prisma.reservasi.findMany({
    where: {
      gerai,
      tanggal,
      meja_id: { not: null },
      status: { in: ['pending', 'approved', 'dikonfirmasi'] },
    },
    select: { meja_id: true, sesi: true },
  });
  const terkunci = new Set(aktif.filter((r) => r.sesi && bentrok(r.sesi, jam)).map((r) => r.meja_id));

  return meja.map((m) => {
    // aturan spesifik (tanggal+jam) menang atas aturan default ('*')
    const s = m.slots.find((x) => x.tanggal === tanggal && x.jam === jam) ?? m.slots.find((x) => x.tanggal === '*');
    const published = s?.published ?? false;
    const open = s?.open ?? true;
    const dipesan = terkunci.has(m.id);
    return {
      id: m.id,
      tipe: m.tipe as TipeMeja,
      nomor: m.nomor,
      kapMin: m.kapasitas_min,
      kapMaks: m.kapasitas_maks,
      published,
      open,
      catatan: s?.catatan ?? '',
      dipesan,
      bisaDipilih: published && open && !dipesan,
    };
  });
}