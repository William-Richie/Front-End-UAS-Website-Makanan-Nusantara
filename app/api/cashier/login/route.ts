import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { bacaSesiKasir, buatToken, hapusCookie, pasangCookie } from '@/lib/cashierAuth';

// GET /api/cashier/login -> untuk cek sesi kasir yang sedang aktif
export async function GET(req: NextRequest) {
  try {
    const sesi = bacaSesiKasir(req);
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

// POST /api/cashier/login -> login kasir
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const user = String(username || '').trim().toLowerCase();
    if (!user || typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const kasir = await prisma.kasir.findUnique({ where: { username: user } });
    const cocok = kasir ? await bcrypt.compare(password, kasir.password) : false;
    if (!kasir || !cocok) {
      return NextResponse.json({ error: 'Username atau password kasir salah.' }, { status: 401 });
    }
    if (!kasir.is_active) {
      return NextResponse.json({ error: 'Akun kasir ini dinonaktifkan. Hubungi admin.' }, { status: 403 });
    }

    const res = NextResponse.json({
      pesan: 'Login berhasil!',
      data: { id: kasir.id, nama: kasir.nama, username: kasir.username, gerai: kasir.gerai },
    });
    pasangCookie(
      res,
      buatToken({ kasirId: kasir.id, nama: kasir.nama, username: kasir.username, gerai: kasir.gerai }),
    );
    return res;
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
