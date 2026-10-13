import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/footer
export async function GET() {
  try {
    let footer = await prisma.kontenFooter.findUnique({
      where: { id: 1 },
    });

    if (!footer) {
      footer = await prisma.kontenFooter.create({
        data: {
          id: 1,
          judul: 'Ikuti Kami',
          copyright: '© 2026 Papeda Restaurant. All Rights Reserved.',
          link_ig: 'https://instagram.com',
          link_tiktok: 'https://tiktok.com',
          link_wa: 'https://wa.me/6281234567890',
          email: 'halo@papedarestaurant.com',
          link_linkedin: 'https://linkedin.com',
        },
      });
    }

    return NextResponse.json({ data: footer });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat footer.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/footer
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { judul, copyright, link_ig, link_wa, link_tiktok, email, link_linkedin } = body;

    const updated = await prisma.kontenFooter.upsert({
      where: { id: 1 },
      update: {
        judul,
        copyright,
        link_ig,
        link_wa,
        link_tiktok,
        email,
        link_linkedin,
      },
      create: {
        id: 1,
        judul,
        copyright,
        link_ig,
        link_wa,
        link_tiktok,
        email,
        link_linkedin,
      },
    });

    return NextResponse.json({ pesan: 'Konten footer berhasil diperbarui!', data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui footer.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
