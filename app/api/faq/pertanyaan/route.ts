import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/faq/pertanyaan - User bertanya via form modal FAQ
export async function POST(req: NextRequest) {
  try {
    const { nama, email, pertanyaan } = await req.json();

    const text = String(pertanyaan || '').trim();
    if (text.length < 10 || text.length > 300) {
      return NextResponse.json({ error: 'Pertanyaan harus 10 - 300 karakter.' }, { status: 400 });
    }

    const created = await prisma.faqPertanyaan.create({
      data: {
        nama: nama ? String(nama).trim() : 'Anonim',
        email: email ? String(email).trim().toLowerCase() : '',
        pertanyaan: text,
      },
    });

    return NextResponse.json({ pesan: 'Pertanyaan berhasil dikirim!', data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim pertanyaan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/faq/pertanyaan - Ambil daftar pertanyaan user (untuk admin)
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
