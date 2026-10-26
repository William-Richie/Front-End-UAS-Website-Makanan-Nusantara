import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';  //Prisma 7 (lama)
import { db } from '@/prisma/db';

// POST /api/pengunjung - Menambah counter pengunjung
export async function POST() {
  try {
    // const stat = await prisma.statistik.upsert({
    //   where: { id: 1 },
    //   update: {
    //     jumlah_pengunjung: { increment: 1 },
    //   },
    //   create: {
    //     id: 1,
    //     jumlah_pengunjung: 1,
    //   },
    // });
    const stat = await db.transaction(async (tx) => {
      const current = await tx.orm.public.Statistik.where({ id: 1 }).first();

      if (!current) {
        return tx.orm.public.Statistik.create({ id: 1, jumlah_pengunjung: 1 });
      }

      return tx.orm.public.Statistik
        .where({ id: 1 })
        .update({ jumlah_pengunjung: current.jumlah_pengunjung + 1 });
    });

    return NextResponse.json({ pesan: 'Pengunjung bertambah', data: stat });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui statistik.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/pengunjung
export async function GET() {
  try {
    // const stat = await prisma.statistik.findUnique({
    //   where: { id: 1 },
    // });
    const stat = await db.orm.public.Statistik.where({ id: 1 }).first();
    return NextResponse.json({ data: stat });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat statistik.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
