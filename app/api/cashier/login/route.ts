import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bacaSesiKasir, hapusCookie } from '@/lib/cashierAuth';

// GET /api/cashier/login -> untuk cek sesi kasir yang sedang aktif
export async function GET(req: NextRequest) {
  try {
    const sesi = await bacaSesiKasir(req);
    if (!sesi) return NextResponse.json({ error: 'Belum login.' }, { status: 401 });

    const kasir = await prisma.kasir.findUnique({ where: { id: sesi.kasirId } });
    if (!kasir || !kasir.is_active) {
      const res = NextResponse.json({ error: 'Akun kasir tidak aktif.' }, { status: 401 });
      hapusCookie(res);
      return res;
    }
    return NextResponse.json({
      data: { id: kasir.id, nama: kasir.nama, username: kasir.username, gerai: kasir.gerai },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/cashier/login -> logout
export async function DELETE() {
  const res = NextResponse.json({ pesan: 'Berhasil keluar.' });
  hapusCookie(res);
  return res;
}
