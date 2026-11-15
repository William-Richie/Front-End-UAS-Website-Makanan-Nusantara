import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { batalkanEwalletKadaluarsa } from '@/lib/expiredOrders';
import { ambilSesiKasirAktif, geraiDariItem } from '@/lib/cashierAuth';

// GET /api/cashier/pesanan
export async function GET(req: NextRequest) {
  try {
    const sesi = await ambilSesiKasirAktif(req);
    if (!sesi) return NextResponse.json({ error: 'Sesi kasir berakhir, silakan login lagi.' }, { status: 401 });

    await batalkanEwalletKadaluarsa();
    const list = await prisma.pesanan.findMany({ orderBy: { created_at: 'desc' } });
    const milikGerai = list.filter((p) => geraiDariItem(p.item) === sesi.gerai);
    return NextResponse.json({ data: milikGerai });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
