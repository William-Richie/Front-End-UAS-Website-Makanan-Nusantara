import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/favorit - Ambil 5 menu favorit
export async function GET() {
  try {
    const list = await prisma.favorit.findMany({
      include: {
        menu: true,
      },
      orderBy: { slot: 'asc' },
    });

    const cleaned = list.map((item) => ({
      slot: item.slot,
      menu_id: item.menu_id,
      nama_makanan: item.menu?.nama_makanan || null,
      deskripsi: item.menu?.deskripsi || null,
      gambar: item.menu?.gambar || null,
      pedas: item.menu?.pedas || 0,
      status: item.menu?.status ?? null,
    }));

    return NextResponse.json({ data: cleaned });
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
