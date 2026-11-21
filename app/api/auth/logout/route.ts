import { NextResponse } from 'next/server';
import { hapusCookieAuth } from '@/lib/auth';
import { hapusCookie as hapusLegacyKasirCookie } from '@/lib/cashierAuth';

export async function POST() {
  const res = NextResponse.json({ pesan: 'Berhasil logout.' });
  hapusCookieAuth(res);
  try {
    hapusLegacyKasirCookie(res);
  } catch {}
  return res;
}
