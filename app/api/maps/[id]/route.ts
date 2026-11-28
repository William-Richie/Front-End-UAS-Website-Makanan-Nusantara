import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { wajibSesi } from '@/lib/auth';

// PUT /api/maps/[id] - Mengedit cabang
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await wajibSesi(req, ['admin']);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const body = await req.json();

    const nama = String(body.nama ?? '').trim();
    const alamat = String(body.alamat ?? '').trim();
    const latitude = parseFloat(body.latitude);
    const longitude = parseFloat(body.longitude);

    if (!nama || !alamat) {
      return NextResponse.json({ error: 'Nama dan alamat wajib diisi.' }, { status: 400 });
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json({ error: 'Latitude dan longitude harus berupa angka.' }, { status: 400 });
    }

    const cabang = await prisma.map.update({
      where: { id: parseInt(id, 10) },
      data: { nama, alamat, latitude, longitude },
    });

    return NextResponse.json({ pesan: 'Cabang berhasil diperbarui!', data: cabang });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui cabang.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/maps/[id] - Menghapus cabang
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await wajibSesi(req, ['admin']);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    await prisma.map.delete({ where: { id: parseInt(id, 10) } });
    return NextResponse.json({ pesan: 'Cabang berhasil dihapus!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus cabang.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}