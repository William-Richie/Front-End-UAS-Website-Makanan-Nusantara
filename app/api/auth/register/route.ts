import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isPasswordStrong, validateEmail, validateNama, validateUsername } from '@/lib/validation';
import { buatTokenAuth, pasangCookieAuth, type AuthSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, nama, email, password } = await req.json();

    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanNama = String(nama || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const pwd = typeof password === 'string' ? password : '';

    const problem =
      validateUsername(cleanUsername) ||
      validateNama(cleanNama) ||
      validateEmail(cleanEmail) ||
      (isPasswordStrong(pwd)
        ? ''
        : 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, dan angka.');

    if (problem) {
      return NextResponse.json({ error: problem }, { status: 400 });
    }

    const [existingUserByUsername, existingKasirByUsername] = await Promise.all([
      prisma.user.findFirst({ where: { username: cleanUsername } }),
      prisma.kasir.findUnique({ where: { username: cleanUsername } }),
    ]);

    if (existingUserByUsername || existingKasirByUsername) {
      return NextResponse.json(
        { error: 'Username sudah digunakan. Silakan pilih username lain.' },
        { status: 409 }
      );
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(pwd, 10);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        nama: cleanNama,
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    const session: AuthSession = {
      role: 'user',
      id: newUser.id,
      nama: newUser.nama,
      email: newUser.email,
      username: (newUser as { username?: string | null }).username || undefined,
    };

    const token = await buatTokenAuth(session);
    const res = NextResponse.json(
      {
        pesan: 'Pendaftaran berhasil!',
        role: 'user',
        redirectTo: '/',
        user: session,
      },
      { status: 201 }
    );

    pasangCookieAuth(res, token);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
