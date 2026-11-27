import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { wajibSesi } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await wajibSesi(req, ['admin']);
  if (auth.error) return auth.error;
  try {
    const data = await prisma.reservasi.findMany({ orderBy: { created_at: 'desc' } });
    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Gagal mengambil data reservasi' }, { status: 500 });
  }
}
