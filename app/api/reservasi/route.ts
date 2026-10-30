import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';  //Prisma 7 (lama)
import { db } from '@/prisma/db';

// GET /api/reservasi - Mengambil reservasi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    const whereClause: { email?: string } = {};
    if (email) {
      whereClause.email = email;
    }

    // const list = await prisma.reservasi.findMany({
    //   where: whereClause,
    //   orderBy: { created_at: 'desc' },
    // });
    const list = await db.orm.public.Reservasi.where(whereClause).orderBy((r) => r.created_at.desc()).all();

    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/reservasi - membuat reservasi baru
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

    // const created = await prisma.reservasi.create({
    //   data: {
    //     user_id: user_id || null,
    //     gerai: String(gerai),
    //     nama: String(nama),
    //     email: String(email),
    //     telepon: String(telepon),
    //     tanggal: String(tanggal),
    //     jam: String(jam),
    //     sesi: String(sesi),
    //     jumlah: Number(jumlah),
    //     ruangan: String(ruangan),
    //     catatan: catatan ? String(catatan) : null,
    //     status: 'pending',
    //   },
    // });
    const created = await db.orm.public.Reservasi.create({
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
    });

    if (user_id) {
      // await prisma.user.update({
      //   where: { id: user_id },
      //   data: { total_reserve: { increment: 1 } },
      // })
    await db
      .transaction(async (tx) => {
        const u = await tx.orm.public.User.where({ id: user_id }).first();
        if (u) {
          await tx.orm.public.User
            .where({ id: user_id })
            .update({ total_reserve: (u.total_reserve ?? 0) + 1 });
        }
      })
      .catch(() => {});
    }

    return NextResponse.json({ pesan: 'Reservasi berhasil dibuat!', data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}