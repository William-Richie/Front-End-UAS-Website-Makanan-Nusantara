import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hitungTerlaris } from '@/lib/terlaris';

// Favorit pilihan admin (tabel favorit, slot 1 - 5)
async function ambilManual() {
  const list = await prisma.favorit.findMany({
    include: {
      menu: true,
    },
    orderBy: { slot: 'asc' },
  });
  return list.map((item) => ({
    slot: item.slot,
    menu_id: item.menu_id,
    nama_makanan: item.menu?.nama_makanan || null,
    deskripsi: item.menu?.deskripsi || null,
    gambar: item.menu?.gambar || null,
    pedas: item.menu?.pedas || 0,
    status: item.menu?.status ?? null,
  }));
}

// GET /api/favorit - Mengambil menu favorit (maks. 5)
//   ?sumber=manual   -> pilihan admin
//   ?sumber=terlaris -> 5 menu terlaris dari pesanan berstatus selesai
//   tanpa parameter  -> dipakai halaman user: mengikuti mode di pengaturan orbit
export async function GET(req: NextRequest) {
  try {
    const sumber = new URL(req.url).searchParams.get('sumber');

    if (sumber === 'terlaris') {
      return NextResponse.json({ data: await hitungTerlaris() });
    }
    if (sumber === 'manual') {
      return NextResponse.json({ data: await ambilManual() });
    }

    const pengaturan = await prisma.pengaturanOrbit.findUnique({ where: { id: 1 } }).catch(() => null);
    if (pengaturan?.mode === 'terlaris') {
      const terlaris = await hitungTerlaris();
      // belum ada pesanan selesai -> tampilkan pilihan admin supaya orbit tidak kosong
      if (terlaris.length > 0) return NextResponse.json({ data: terlaris });
    }

    return NextResponse.json({ data: await ambilManual() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat menu favorit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/favorit - Update slot favorit
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.data;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    // Update or insert slot 1 - 5
    for (const item of items) {
      if (item.slot && item.menu_id) {
        const existing = await prisma.favorit.findFirst({
          where: { slot: Number(item.slot) },
        });
        if (existing) {
          await prisma.favorit.update({
            where: { id: existing.id },
            data: { menu_id: Number(item.menu_id) },
          });
        } else {
          await prisma.favorit.create({
            data: {
              slot: Number(item.slot),
              menu_id: Number(item.menu_id),
            },
          });
        }
      }
    }

    return NextResponse.json({ pesan: 'Menu favorit berhasil diperbarui!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui menu favorit.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
