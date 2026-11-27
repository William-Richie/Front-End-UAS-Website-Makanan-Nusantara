import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { wajibSesi } from '@/lib/auth';

// PUT /api/reservasi/[id]/batal - Membatalkan reservasi
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await wajibSesi(req, ['admin', 'user']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const existing = await prisma.reservasi.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Reservasi tidak ditemukan.' }, { status: 404 });
    }
    if (auth.sesi.role !== 'admin' && existing.user_id !== auth.sesi.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

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
