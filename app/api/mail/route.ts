import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/mail?user_id=... - Pesan (jawaban admin atas pertanyaan FAQ) untuk satu pengguna
export async function GET(req: NextRequest) {
  try {
    const userId = new URL(req.url).searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ data: [] });
    }

    const list = await prisma.faqPertanyaan.findMany({
      where: { user_id: userId, kirim_mail: true, jawaban: { not: null } },
      orderBy: { dijawab_at: 'desc' },
      select: { id: true, pertanyaan: true, jawaban: true, dijawab_at: true, dibaca_user: true },
    });

    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat Mail.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/mail - Tandai pesan sudah dibaca. body: { user_id, ids?: number[] } (tanpa ids = semua)
export async function PUT(req: NextRequest) {
  try {
    const { user_id, ids } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: 'user_id wajib diisi.' }, { status: 400 });
    }

    const daftarId = Array.isArray(ids) ? ids.map(Number).filter((n) => Number.isInteger(n)) : null;

    const hasil = await prisma.faqPertanyaan.updateMany({
      where: {
        user_id: String(user_id),
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
