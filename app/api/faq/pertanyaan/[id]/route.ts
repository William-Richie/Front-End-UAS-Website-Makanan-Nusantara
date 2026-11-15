import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/faq/pertanyaan/[id] - Admin menjawab pertanyaan pengunjung
// body: { jawaban: string, kirim_mail: boolean, tampil_web: boolean }
//   kirim_mail -> jawaban masuk ke Mail pengguna (hanya untuk pertanyaan yang dikirim saat login)
//   tampil_web -> pertanyaan + jawaban ditambahkan ke daftar FAQ di web
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pertanyaanId = parseInt(id, 10);
    const { jawaban, kirim_mail, tampil_web } = await req.json();

    const teks = String(jawaban || '').trim();
    if (teks.length < 2 || teks.length > 1000) {
      return NextResponse.json({ error: 'Jawaban harus 2 - 1000 karakter.' }, { status: 400 });
    }

    const mail = kirim_mail === true;
    const web = tampil_web === true;
    if (!mail && !web) {
      return NextResponse.json(
        { error: 'Pilih tujuan jawaban: kirim ke Mail pengguna dan/atau tampilkan di web.' },
        { status: 400 }
      );
    }

    const row = await prisma.faqPertanyaan.findUnique({ where: { id: pertanyaanId } });
    if (!row) {
      return NextResponse.json({ error: 'Pertanyaan tidak ditemukan.' }, { status: 404 });
    }
    if (mail && !row.user_id) {
      return NextResponse.json(
        { error: 'Pertanyaan ini dikirim tanpa login, jadi tidak bisa dikirim ke Mail. Pilih tampilkan di web.' },
        { status: 400 }
      );
    }

    const sudahTampil = row.tampil_web;

    const updated = await prisma.faqPertanyaan.update({
      where: { id: pertanyaanId },
      data: {
        jawaban: teks,
        dijawab_at: new Date(),
        dibaca: true,
        kirim_mail: mail,
        tampil_web: web || sudahTampil,
        dibaca_user: false,
      },
    });

    if (web && !sudahTampil) {
      await prisma.faq.create({ data: { pertanyaan: row.pertanyaan, jawaban: teks } });
    }

    return NextResponse.json({ pesan: 'Jawaban berhasil disimpan!', data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan jawaban.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
