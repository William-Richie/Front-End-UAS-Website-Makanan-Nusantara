import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { wajibSesi } from '@/lib/auth';

// GET /api/faq - Mengambil daftar FAQ
export async function GET() {
  try {
    const data = await prisma.faq.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat data FAQ.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/faq - Menambah FAQ (untuk admin)
export async function POST(req: NextRequest) {
  const auth = await wajibSesi(req, ['admin']);
  if (auth.error) return auth.error;
  try {
    const { pertanyaan, jawaban } = await req.json();
    const newFaq = await prisma.faq.create({
      data: {
        pertanyaan: String(pertanyaan),
        jawaban: String(jawaban),
      },
    });
    return NextResponse.json({ pesan: 'FAQ berhasil ditambahkan!', id_baru: newFaq.id, data: newFaq });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan FAQ.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
