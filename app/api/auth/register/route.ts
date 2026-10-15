import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isPasswordStrong, validateEmail, validateNama } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const { nama, email, password } = await req.json();

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanNama = String(nama || '').trim();

    const pwd = typeof password === 'string' ? password : '';
    const problem =
      validateNama(cleanNama) ||
      validateEmail(cleanEmail) ||
      (isPasswordStrong(pwd)
        ? ''
        : 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, dan angka.');

    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(pwd, 10);

    const newUser = await prisma.user.create({
      data: {
        nama: cleanNama,
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        pesan: 'Pendaftaran berhasil!',
        user: { id: newUser.id, nama: newUser.nama, email: newUser.email },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
