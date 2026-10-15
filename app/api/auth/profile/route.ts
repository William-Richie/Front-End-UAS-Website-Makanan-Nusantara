import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateNama } from '@/lib/validation';

// PUT /api/auth/profile - ganti nama pengguna
export async function PUT(req: NextRequest) {
  try {
    const { id, email, nama } = await req.json();
    const cleanNama = String(nama || '').trim();

    const problem = validateNama(cleanNama);
    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: String(id || '') } });
    if (!user || user.email !== String(email || '').trim().toLowerCase()) {
      return NextResponse.json({ error: 'Akun tidak ditemukan, silakan login ulang.' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { nama: cleanNama },
    });

    return NextResponse.json({
      pesan: 'Profil berhasil diperbarui!',
      user: { id: updated.id, nama: updated.nama, email: updated.email },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}