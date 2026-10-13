import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/faq/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { pertanyaan, jawaban } = await req.json();

    await prisma.faq.update({
      where: { id: parseInt(id, 10) },
      data: {
        pertanyaan: pertanyaan !== undefined ? String(pertanyaan) : undefined,
        jawaban: jawaban !== undefined ? String(jawaban) : undefined,
      },
    });

    return NextResponse.json({ pesan: 'Data FAQ berhasil diperbarui!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui FAQ.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/faq/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.faq.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json({ pesan: 'FAQ berhasil dihapus!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus FAQ.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
