import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/reservasi/[id]/batal - Batalkan reservasi
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const updated = await prisma.reservasi.update({
      where: { id },
      data: { status: 'dibatalkan' },
    });

    return NextResponse.json({ pesan: 'Reservasi berhasil dibatalkan.', data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
