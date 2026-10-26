import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';  //Prisma 7 (lama)
import { db } from '@/prisma/db';

// PUT /api/menu/[id] - Update menu
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuId = parseInt(id, 10);
    const body = await req.json();
    const { nama_kategori, nama_makanan, harga, gambar, status, deskripsi, pedas } = body;

    // const updated = await prisma.menu.update({
    //   where: { id: menuId },
    //   data: {
    //     nama_kategori: nama_kategori !== undefined ? String(nama_kategori) : undefined,
    //     nama_makanan: nama_makanan !== undefined ? String(nama_makanan) : undefined,
    //     harga: harga !== undefined ? Number(harga) : undefined,
    //     gambar: gambar !== undefined ? String(gambar) : undefined,
    //     status: status !== undefined ? (status === true || status === 'true') : undefined,
    //     deskripsi: deskripsi !== undefined ? (deskripsi ? String(deskripsi) : null) : undefined,
    //     pedas: pedas !== undefined ? Number(pedas) : undefined,
    //   },
    // });
    const updated = await db.orm.public.Menu.where({ id: menuId })
      .update({
        nama_kategori: nama_kategori !== undefined ? String(nama_kategori) : undefined,
        nama_makanan: nama_makanan !== undefined ? String(nama_makanan) : undefined,
        harga: harga !== undefined ? Number(harga) : undefined,
        gambar: gambar !== undefined ? String(gambar) : undefined,
        status: status !== undefined ? (status === true || status === 'true') : undefined,
        deskripsi: deskripsi !== undefined ? (deskripsi ? String(deskripsi) : null) : undefined,
        pedas: pedas !== undefined ? Number(pedas) : undefined,
      });

    return NextResponse.json({ pesan: 'Data menu berhasil diperbarui!', data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui menu.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/menu/[id] - Menghapus menu
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menuId = parseInt(id, 10);

    // await prisma.menu.delete({
    //   where: { id: menuId },
    // });
    await db.orm.public.Menu.where({ id: menuId }).delete();

    return NextResponse.json({ pesan: 'Menu berhasil dihapus!' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus menu.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
