import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/faq/pertanyaan - Pengguna yang sudah login mengirim pertanyaan; jawabannya masuk ke Mail akun tersebut
export async function POST(req: NextRequest) {
  try {
    const { pertanyaan, user_id } = await req.json();

    // hanya pengguna yang sudah login yang boleh bertanya
    const user = user_id ? await prisma.user.findUnique({ where: { id: String(user_id) } }) : null;
    if (!user) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu untuk mengirim pertanyaan.' }, { status: 401 });
    }
    if (!user.is_active) {
      return NextResponse.json({ error: 'Akun Anda sedang dinonaktifkan.' }, { status: 403 });
    }

    const text = String(pertanyaan || '').trim();
    if (text.length < 10 || text.length > 300) {
      return NextResponse.json({ error: 'Pertanyaan harus 10 - 300 karakter.' }, { status: 400 });
    }

    const created = await prisma.faqPertanyaan.create({
      data: {
        nama: user.nama,
        email: user.email,
        pertanyaan: text,
        user_id: user.id,
      },
    });

    return NextResponse.json({ pesan: 'Pertanyaan berhasil dikirim!', data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim pertanyaan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/faq/pertanyaan - Mengambil daftar pertanyaan dari user (untuk admin)
export async function GET() {
  try {
    const list = await prisma.faqPertanyaan.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pertanyaan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
