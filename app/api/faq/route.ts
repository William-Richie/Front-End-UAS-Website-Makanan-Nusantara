import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/faq - Daftar FAQ
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

// POST /api/faq - Tambah FAQ (admin)
export async function POST(req: NextRequest) {
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
