import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/reservasi -> semua reservasi (terbaru dulu)
export async function GET() {
  try {
    const data = await prisma.reservasi.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Gagal mengambil data reservasi' }, { status: 500 });
  }
}
