import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/konten - Ambil teks dinamis web
export async function GET() {
  try {
    let konten = await prisma.kontenWeb.findUnique({
      where: { id: 1 },
    });

    if (!konten) {
      konten = await prisma.kontenWeb.create({
        data: {
          id: 1,
          teks_hero: 'Welcome to Our\nPapeda Restaurant',
          teks_about: 'Selamat datang di Papeda Restaurant, tempat terbaik untuk menikmati hidangan khas Nusantara Timur. Kami menyajikan berbagai menu tradisional dengan cita rasa otentik yang akan memanjakan lidah Anda.',
        },
      });
    }

    return NextResponse.json({ data: konten });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat konten web.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/konten - Update teks dinamis web (admin)
export async function PUT(req: NextRequest) {
  try {
    const { teks_hero, teks_about } = await req.json();

    const updated = await prisma.kontenWeb.upsert({
      where: { id: 1 },
      update: {
        teks_hero: teks_hero !== undefined ? String(teks_hero) : undefined,
        teks_about: teks_about !== undefined ? String(teks_about) : undefined,
      },
      create: {
        id: 1,
        teks_hero: String(teks_hero || ''),
        teks_about: String(teks_about || ''),
      },
    });

    return NextResponse.json({ pesan: 'Konten web berhasil diperbarui!', data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui konten web.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
