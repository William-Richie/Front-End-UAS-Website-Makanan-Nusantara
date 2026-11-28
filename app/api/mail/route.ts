import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { wajibSesi } from '@/lib/auth';

// GET /api/mail - Pesan (jawaban admin atas pertanyaan FAQ) untuk pengguna yang login
export async function GET(req: NextRequest) {
  const auth = await wajibSesi(req, ['user']);
  if (auth.error) return auth.error;

  try {
    const list = await prisma.faqPertanyaan.findMany({
      where: { user_id: auth.sesi.id, kirim_mail: true, jawaban: { not: null } },
      orderBy: { dijawab_at: 'desc' },
      select: { id: true, pertanyaan: true, jawaban: true, dijawab_at: true, dibaca_user: true },
    });

    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat Mail.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/mail - Tandai pesan sudah dibaca. body: { ids?: number[] } (tanpa ids = semua)
export async function PUT(req: NextRequest) {
  const auth = await wajibSesi(req, ['user']);
  if (auth.error) return auth.error;

  try {
    const { ids } = await req.json();

    const daftarId = Array.isArray(ids) ? ids.map(Number).filter((n) => Number.isInteger(n)) : null;

    const hasil = await prisma.faqPertanyaan.updateMany({
      where: {
        user_id: auth.sesi.id,
        kirim_mail: true,
        dibaca_user: false,
        ...(daftarId ? { id: { in: daftarId } } : {}),
      },
      data: { dibaca_user: true },
    });

    return NextResponse.json({ ok: true, diubah: hasil.count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui Mail.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
