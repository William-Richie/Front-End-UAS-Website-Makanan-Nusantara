import { NextRequest, NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';  //Prisma 7 (lama)
import { db } from '@/prisma/db';

// GET /api/faq - Mengambil daftar FAQ
export async function GET() {
  try {
    // const data = await prisma.faq.findMany({
    //   orderBy: { id: 'asc' },
    // });
    const data = await db.orm.public.Faq.where({}).orderBy((faq) => faq.id.asc()).all();
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat data FAQ.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/faq - Menambah FAQ (untuk admin)
export async function POST(req: NextRequest) {
  try {
    const { pertanyaan, jawaban } = await req.json();
    // const newFaq = await prisma.faq.create({
    //   data: {
    //     pertanyaan: String(pertanyaan),
    //     jawaban: String(jawaban),
    //   },
    // });
    const newFaq = await db.orm.public.Faq.create({
      pertanyaan: String(pertanyaan),
      jawaban: String(jawaban),
    });
    return NextResponse.json({ pesan: 'FAQ berhasil ditambahkan!', id_baru: newFaq.id, data: newFaq });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menambahkan FAQ.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
