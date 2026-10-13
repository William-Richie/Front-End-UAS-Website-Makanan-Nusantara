import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { nama, email, password } = await req.json();

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanNama = String(nama || '').trim();

    if (!cleanNama || !cleanEmail || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Nama, email, dan password (min. 6 karakter) wajib diisi.' },
        { status: 400 }
      );
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

    const hashedPassword = await bcrypt.hash(password, 10);

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
