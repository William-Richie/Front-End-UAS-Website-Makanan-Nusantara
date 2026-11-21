import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const STATUS_VALID = ['pending', 'approved', 'complete', 'dibatalkan'];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status: string };
    if (!STATUS_VALID.includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    const lepaskanVip = ['complete', 'selesai', 'dibatalkan', 'cancelled'].includes(status);
    const updated = await prisma.reservasi.update({
      where: { id },
      data: {
        status,
        ...(lepaskanVip ? { vip: null } : {}),
      },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Gagal memperbarui status reservasi' }, { status: 500 });
  }
}
