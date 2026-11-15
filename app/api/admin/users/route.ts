import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { created_at: 'asc' } });
    const reservasi = await prisma.reservasi.findMany({ select: { user_id: true } });

    const hitung = new Map<string, number>();
    for (const r of reservasi) {
      if (r.user_id) hitung.set(r.user_id, (hitung.get(r.user_id) ?? 0) + 1);
    }

    const data = users.map((u) => ({
      id: u.id,
      nama: u.nama,
      email: u.email,
      created_at: u.created_at,
      total_reserve: hitung.get(u.id) ?? 0,
      Is_Active: u.is_active,
    }));
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Gagal mengambil data user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { ids } = (await req.json()) as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'ids kosong' }, { status: 400 });
    }
    await prisma.user.deleteMany({ where: { id: { in: ids.map(String) } } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Gagal menghapus user' }, { status: 500 });
  }
}
