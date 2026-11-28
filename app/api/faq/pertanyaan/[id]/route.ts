import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { wajibSesi } from '@/lib/auth';

// PUT /api/faq/pertanyaan/[id] - Admin mengelola pertanyaan masuk
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await wajibSesi(req, ['admin']);
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const pertanyaanId = parseInt(id, 10);
    if (!Number.isInteger(pertanyaanId)) {
      return NextResponse.json({ error: 'ID pertanyaan tidak valid.' }, { status: 400 });
    }

    const body = await req.json();

    const row = await prisma.faqPertanyaan.findUnique({ where: { id: pertanyaanId } });
    if (!row) {
      return NextResponse.json({ error: 'Pertanyaan tidak ditemukan.' }, { status: 404 });
    }

    if (body.jawaban === undefined) {
      if (body.dibaca !== true) {
        return NextResponse.json({ error: 'Tidak ada perubahan yang diminta.' }, { status: 400 });
      }
      const updated = await prisma.faqPertanyaan.update({
        where: { id: pertanyaanId },
        data: { dibaca: true },
      });
      return NextResponse.json({ pesan: 'Pertanyaan ditandai sudah dibaca.', data: updated });
    }

    const teks = String(body.jawaban || '').trim();
    if (teks.length < 2 || teks.length > 1000) {
      return NextResponse.json({ error: 'Jawaban harus 2 - 1000 karakter.' }, { status: 400 });
    }
    if (!row.user_id) {
      return NextResponse.json(
        { error: 'Pertanyaan ini dikirim sebelum login diwajibkan, jadi tidak bisa dijawab lewat Mail.' },
        { status: 400 }
      );
    }

    const updated = await prisma.faqPertanyaan.update({
      where: { id: pertanyaanId },
      data: {
        jawaban: teks,
        dijawab_at: new Date(),
        dibaca: true,
        kirim_mail: true,
        dibaca_user: false,
      },
    });

    return NextResponse.json({ pesan: 'Jawaban berhasil dikirim ke Mail pengguna!', data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui pertanyaan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
