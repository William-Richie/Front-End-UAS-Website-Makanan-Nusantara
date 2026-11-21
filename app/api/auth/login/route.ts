import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { buatTokenAuth, pasangCookieAuth, type AuthSession } from '@/lib/auth';
import { pasangCookie as pasangLegacyKasirCookie, buatToken as buatLegacyKasirToken } from '@/lib/cashierAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.identifier || body.email || body.username || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.toLowerCase();
    const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (cleanIdentifier === adminUser) {
      const matchAdmin = password === adminPass;
      if (matchAdmin) {
        const session: AuthSession = {
          role: 'admin',
          id: 'admin',
          nama: 'Administrator',
          username: adminUser,
          email: 'admin@papeda.com',
        };
        const token = await buatTokenAuth(session);
        const res = NextResponse.json({
          pesan: 'Login berhasil sebagai Administrator!',
          role: 'admin',
          redirectTo: '/admin',
          user: session,
        });
        pasangCookieAuth(res, token);
        return res;
      }
    }

    const kasir = await prisma.kasir.findUnique({
      where: { username: cleanIdentifier },
    });

    if (kasir) {
      const cocok = await bcrypt.compare(password, kasir.password);
      if (!cocok) {
        return NextResponse.json(
          { error: 'Password kasir salah.' },
          { status: 401 }
        );
      }

      if (!kasir.is_active) {
        return NextResponse.json(
          { error: 'Akun kasir ini dinonaktifkan. Hubungi admin.' },
          { status: 403 }
        );
      }

      const session: AuthSession = {
        role: 'cashier',
        id: kasir.id,
        nama: kasir.nama,
        username: kasir.username,
        gerai: kasir.gerai,
        email: `${kasir.username}@kasir.papeda.com`,
      };

      const token = await buatTokenAuth(session);
      const res = NextResponse.json({
        pesan: 'Login berhasil sebagai Kasir!',
        role: 'cashier',
        redirectTo: '/cashier',
        user: session,
      });

      pasangCookieAuth(res, token);

      try {
        const legacyToken = buatLegacyKasirToken({
          kasirId: kasir.id,
          nama: kasir.nama,
          username: kasir.username,
          gerai: kasir.gerai,
        });
        pasangLegacyKasirCookie(res, legacyToken);
      } catch {}

      return res;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { username: cleanIdentifier },
        ],
      },
    });

    if (user) {
      const cocok = await bcrypt.compare(password, user.password);
      if (!cocok) {
        return NextResponse.json(
          { error: 'Email/Username atau password salah.' },
          { status: 401 }
        );
      }

      if (!user.is_active) {
        return NextResponse.json(
          { error: 'Akun Anda dinonaktifkan. Hubungi admin.' },
          { status: 403 }
        );
      }

      const session: AuthSession = {
        role: 'user',
        id: user.id,
        nama: user.nama,
        email: user.email,
        username: (user as { username?: string | null }).username || undefined,
      };

      const token = await buatTokenAuth(session);
      const res = NextResponse.json({
        pesan: 'Login berhasil!',
        role: 'user',
        redirectTo: '/',
        user: session,
      });

      pasangCookieAuth(res, token);
      return res;
    }

    return NextResponse.json(
      { error: 'Akun tidak ditemukan. Periksa kembali email atau username Anda.' },
      { status: 401 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
