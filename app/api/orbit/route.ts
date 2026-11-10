import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ORBIT_DEFAULT, rapikanOrbit } from '@/lib/orbit';

// GET /api/orbit - Mengambil pengaturan tampilan orbit favorit
export async function GET() {
  try {
    const row = await prisma.pengaturanOrbit.findUnique({ where: { id: 1 } });
    return NextResponse.json({ data: rapikanOrbit(row) });
  } catch (error: unknown) {
    // tabel belum dibuat / database bermasalah: website tetap jalan pakai tampilan default
    console.error('Gagal memuat pengaturan orbit:', error);
    return NextResponse.json({ data: ORBIT_DEFAULT });
  }
}

// PUT /api/orbit - Simpan pengaturan tampilan orbit
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const setting = rapikanOrbit(body);

    const saved = await prisma.pengaturanOrbit.upsert({
      where: { id: 1 },
      update: setting,
      create: { id: 1, ...setting },
    });

    return NextResponse.json({ pesan: 'Tampilan orbit berhasil disimpan!', data: rapikanOrbit(saved) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan tampilan orbit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
