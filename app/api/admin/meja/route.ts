import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { daftarMeja } from '@/lib/meja';
import { TIPE_MEJA, type TipeMeja } from '@/lib/mejaTipe';

const tipeValid = (t: unknown): t is TipeMeja => TIPE_MEJA.includes(t as TipeMeja);
const kunci = (meja_id: number, tanggal: string, jam: string) => ({
  meja_id_tanggal_jam: { meja_id, tanggal, jam },
});

// GET ?gerai=..&tanggal=..&jam=..
export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const gerai = sp.get('gerai');
    const tanggal = sp.get('tanggal');
    const jam = sp.get('jam');
    if (!gerai || !tanggal || !jam) return NextResponse.json({ data: [] });
    return NextResponse.json({ data: await daftarMeja(gerai, tanggal, jam) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat meja.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST { gerai, tipe, jumlah } -> sinkronkan jumlah meja
export async function POST(req: NextRequest) {
  try {
    const { gerai, tipe, jumlah } = await req.json();
    const n = Number(jumlah);
    if (!gerai || !tipeValid(tipe) || !Number.isInteger(n) || n < 0 || n > 50) {
      return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }
    const ada = await prisma.meja.findMany({ where: { gerai, tipe }, select: { nomor: true } });
    const nomorAda = new Set(ada.map((m) => m.nomor));
    const baru = [];
    for (let i = 1; i <= n; i++) if (!nomorAda.has(i)) baru.push({ gerai, tipe, nomor: i });
    if (baru.length) await prisma.meja.createMany({ data: baru });
    await prisma.meja.deleteMany({ where: { gerai, tipe, nomor: { gt: n } } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT { meja_id, tanggal, jam, published?, open?, catatan?, kapMin?, kapMaks?, semua? }
export async function PUT(req: NextRequest) {
  try {
    const b = await req.json();
    const meja_id = Number(b.meja_id);
    if (!Number.isInteger(meja_id)) {
      return NextResponse.json({ error: 'Meja tidak valid.' }, { status: 400 });
    }

    if (b.kapMin !== undefined || b.kapMaks !== undefined) {
      const min = Number(b.kapMin);
      const maks = Number(b.kapMaks);
      if (!Number.isInteger(min) || !Number.isInteger(maks) || min < 1 || maks < min || maks > 50) {
        return NextResponse.json({ error: 'Kapasitas tidak valid.' }, { status: 400 });
      }
      await prisma.meja.update({ where: { id: meja_id }, data: { kapasitas_min: min, kapasitas_maks: maks } });
    }

    const ubah: { published?: boolean; open?: boolean; catatan?: string } = {};
    if (typeof b.published === 'boolean') ubah.published = b.published;
    if (typeof b.open === 'boolean') ubah.open = b.open;
    if (typeof b.catatan === 'string') {
      if (b.catatan.length > 100) {
        return NextResponse.json({ error: 'Catatan maksimal 100 karakter.' }, { status: 400 });
      }
      ubah.catatan = b.catatan;
    }

    if (Object.keys(ubah).length > 0) {
      const semua = b.semua === true;
      const tanggal = semua ? '*' : String(b.tanggal);
      const jam = semua ? '*' : String(b.jam);

      // salin nilai yang berlaku sekarang, supaya field lain tidak ter-reset
      const spesifik = await prisma.mejaSlot.findUnique({ where: kunci(meja_id, tanggal, jam) });
      const dasar = spesifik ?? (await prisma.mejaSlot.findUnique({ where: kunci(meja_id, '*', '*') }));
      const nilai = {
        published: dasar?.published ?? false,
        open: dasar?.open ?? true,
        catatan: dasar?.catatan ?? '',
        ...ubah,
      };

      await prisma.mejaSlot.upsert({
        where: kunci(meja_id, tanggal, jam),
        update: nilai,
        create: { meja_id, tanggal, jam, ...nilai },
      });

      // "terapkan ke semua": hapus aturan spesifik supaya default yang berlaku
      if (semua) await prisma.mejaSlot.deleteMany({ where: { meja_id, NOT: { tanggal: '*' } } });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}