import { NextRequest, NextResponse } from 'next/server';
import { daftarMeja } from '@/lib/meja';
import { TIPE_MEJA, type TipeMeja } from '@/lib/mejaTipe';

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const gerai = sp.get('gerai');
    const tanggal = sp.get('tanggal');
    const jam = sp.get('jam');
    const tipe = sp.get('tipe');
    if (!gerai || !tanggal || !jam) return NextResponse.json({ data: [] });

    const semua = await daftarMeja(
      gerai,
      tanggal,
      jam,
      TIPE_MEJA.includes(tipe as TipeMeja) ? (tipe as TipeMeja) : undefined
    );
    const data = semua
      .filter((m) => m.published)
      .map((m) => ({
        id: m.id,
        tipe: m.tipe,
        nomor: m.nomor,
        kapMin: m.kapMin,
        kapMaks: m.kapMaks,
        open: m.open,
        dipesan: m.dipesan,
        bisaDipilih: m.bisaDipilih,
      }));
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat meja.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}