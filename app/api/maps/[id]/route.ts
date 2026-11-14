import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE /api/maps/[id] - Menghapus cabang
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.map.delete({ where: { id: parseInt(id, 10) } });
    return NextResponse.json({ pesan: 'Cabang berhasil dihapus!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus cabang.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}