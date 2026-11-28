import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { wajibSesi } from '@/lib/auth';

// GET /api/menu - Mengambil semua menu
export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ data: menus });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat menu.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/menu - Menambah menu baru
export async function POST(req: NextRequest) {
  const auth = await wajibSesi(req, ['admin']);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { nama_kategori, nama_makanan, harga, gambar, status, deskripsi, pedas } = body;

    const newMenu = await prisma.menu.create({
      data: {
        nama_kategori: String(nama_kategori || ''),
        nama_makanan: String(nama_makanan || ''),
        harga: Number(harga || 0),
        gambar: String(gambar || ''),
        status: status === true || status === 'true',
        deskripsi: deskripsi ? String(deskripsi) : null,
        pedas: Number(pedas || 0),
      },
    });

    return NextResponse.json({
      pesan: 'Menu berhasil ditambahkan!',
      id_baru: newMenu.id,
      data: newMenu,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan menu.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
