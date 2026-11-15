import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/faq/pertanyaan - Form modal FAQ di mana user bisa memberikan pertanyaan
export async function POST(req: NextRequest) {
  try {
    const { nama, email, pertanyaan, user_id } = await req.json();

    const text = String(pertanyaan || '').trim();
    if (text.length < 10 || text.length > 300) {
      return NextResponse.json({ error: 'Pertanyaan harus 10 - 300 karakter.' }, { status: 400 });
    }

    const user = user_id ? await prisma.user.findUnique({ where: { id: String(user_id) } }) : null;

    const created = await prisma.faqPertanyaan.create({
      data: {
        nama: nama ? String(nama).trim() : user?.nama || 'Anonim',
        email: email ? String(email).trim().toLowerCase() : user?.email || '',
        pertanyaan: text,
        user_id: user ? user.id : null,
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
