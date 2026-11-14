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
    const sediaKembali = ['complete', 'selesai', 'dibatalkan', 'cancelled'].includes(status);
    await prisma.reservasi.update({
      where: { id },
      data: {status, ...(['complete', 'selesai', 'dibatalkan', 'cancelled'].includes(status) ? { vip: null } : {}), },
    });
    const hasil = await prisma.reservasi.updateMany({ 
      where: { id }, data: { status, ...(status === 'dibatalkan' ? { vip: null } : {}) }
    });
    if (hasil.count === 0) {
      return NextResponse.json({ message: 'Reservasi tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Gagal memperbarui status reservasi' }, { status: 500 });
  }
}
