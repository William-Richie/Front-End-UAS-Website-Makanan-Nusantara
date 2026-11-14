import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const { ids, Is_Active } = (await req.json()) as { ids: string[]; Is_Active: boolean };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'ids kosong' }, { status: 400 });
    }
    await prisma.user.updateMany({
      where: { id: { in: ids.map(String) } },
      data: { is_active: Boolean(Is_Active) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Gagal memperbarui status user' }, { status: 500 });
  }
}
