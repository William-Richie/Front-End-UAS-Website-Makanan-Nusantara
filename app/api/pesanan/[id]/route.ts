import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/pesanan/[id] - Update status pesanan
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    const updated = await prisma.pesanan.update({
      where: { id: parseInt(id, 10) },
      data: { status: String(status) },
    });

    return NextResponse.json({ pesan: `Status pesanan berhasil diubah menjadi ${status}`, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui status pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
