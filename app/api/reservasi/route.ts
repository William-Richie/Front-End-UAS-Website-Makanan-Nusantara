import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/reservasi - Ambil reservasi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    const whereClause: { email?: string } = {};
    if (email) {
      whereClause.email = email;
    }

    const list = await prisma.reservasi.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/reservasi - Buat reservasi baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      gerai,
      nama,
      email,
      telepon,
      tanggal,
      jam,
      sesi,
      jumlah,
      ruangan,
      catatan,
    } = body;

    if (!gerai || !nama || !email || !telepon || !tanggal || !jumlah || !sesi || !jam || !ruangan) {
      return NextResponse.json({ error: 'Semua data reservasi wajib diisi.' }, { status: 400 });
    }

    const created = await prisma.reservasi.create({
      data: {
        user_id: user_id || null,
        gerai: String(gerai),
        nama: String(nama),
        email: String(email),
        telepon: String(telepon),
        tanggal: String(tanggal),
        jam: String(jam),
        sesi: String(sesi),
        jumlah: Number(jumlah),
        ruangan: String(ruangan),
        catatan: catatan ? String(catatan) : null,
        status: 'pending',
      },
    });

    if (user_id) {
      await prisma.user.update({
        where: { id: user_id },
        data: { total_reserve: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ pesan: 'Reservasi berhasil dibuat!', data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
