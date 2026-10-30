import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';  //Prisma 7 (lama)
import { db } from '@/prisma/db';

// PUT /api/reservasi/[id]/batal - Membatalkan reservasi
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // const updated = await prisma.reservasi.update({
    //   where: { id },
    //   data: { status: 'dibatalkan' },
    // });
    const updated = await db.orm.public.Reservasi.where({ id }).update({ status: 'dibatalkan' });

    return NextResponse.json({ pesan: 'Reservasi berhasil dibatalkan.', data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
