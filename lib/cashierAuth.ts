import jwt from 'jsonwebtoken';
import type { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE, getSecretKey, verifikasiTokenAuth } from '@/lib/auth';

export const KASIR_COOKIE = 'papeda_kasir_token';
const MASA_BERLAKU_DETIK = 60 * 60 * 12; // 12 jam

export type KasirSesi = {
  kasirId: string;
  nama: string;
  username: string;
  gerai: string;
};

function rahasia(): string {
  return getSecretKey();
}

export function buatToken(sesi: KasirSesi): string {
  return jwt.sign(sesi, rahasia(), { expiresIn: MASA_BERLAKU_DETIK });
}

export function pasangCookie(res: NextResponse, token: string) {
  res.cookies.set(KASIR_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MASA_BERLAKU_DETIK,
  });
}

export function hapusCookie(res: NextResponse) {
  res.cookies.set(KASIR_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0, expires: new Date(0) });
}

export async function bacaSesiKasir(req: NextRequest): Promise<KasirSesi | null> {
  const tokenAuth = req.cookies.get(AUTH_COOKIE)?.value;
  if (tokenAuth) {
    const payload = await verifikasiTokenAuth(tokenAuth);
    if (payload) {
      if (payload.role !== 'cashier' || !payload.id || !payload.gerai) {
        return null;
      }
      return {
        kasirId: String(payload.id),
        nama: String(payload.nama || ''),
        username: String(payload.username || ''),
        gerai: String(payload.gerai),
      };
    }
  }

  const tokenKasir = req.cookies.get(KASIR_COOKIE)?.value;
  if (tokenKasir) {
    try {
      const d = jwt.verify(tokenKasir, rahasia()) as Partial<KasirSesi>;
      if (d.kasirId && d.gerai) {
        return {
          kasirId: String(d.kasirId),
          nama: String(d.nama || ''),
          username: String(d.username || ''),
          gerai: String(d.gerai),
        };
      }
    } catch {}
  }

  return null;
}

export async function ambilSesiKasirAktif(req: NextRequest): Promise<KasirSesi | null> {
  const sesi = await bacaSesiKasir(req);
  if (!sesi) return null;
  const kasir = await prisma.kasir.findUnique({ where: { id: sesi.kasirId } });
  if (!kasir || !kasir.is_active) return null;
  return { kasirId: kasir.id, nama: kasir.nama, username: kasir.username, gerai: kasir.gerai };
}

export function geraiDariItem(item: string): string {
  try {
    const d = JSON.parse(item);
    return d && typeof d === 'object' ? String(d.gerai || '') : '';
  } catch {
    return '';
  }
}
