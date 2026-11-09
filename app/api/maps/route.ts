import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/maps
export async function GET() {
  try {
    const list = await prisma.map.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat cabang.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/maps
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, alamat, latitude, longitude } = body;

    const created = await prisma.map.create({
      data: {
        nama: String(nama || ''),
        alamat: String(alamat || ''),
        latitude: Number(latitude || 0),
        longitude: Number(longitude || 0),
      },
    });

    return NextResponse.json({ pesan: 'Cabang berhasil ditambahkan!', id_baru: created.id, data: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan cabang.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
