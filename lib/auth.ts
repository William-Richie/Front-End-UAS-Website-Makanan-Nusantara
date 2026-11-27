import { NextRequest, NextResponse } from 'next/server';

export type AuthRole = 'admin' | 'cashier' | 'user';

export interface AuthSession {
  role: AuthRole;
  id: string;
  nama: string;
  email?: string;
  username?: string;
  gerai?: string;
  exp?: number;
}

export const AUTH_COOKIE = 'papeda_session';
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 jam

export function getSecretKey(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.KASIR_JWT_SECRET ||
    'papeda-nusantara-super-secret-auth-key-min-32-characters'
  );
}

// Helper Base64Url
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecretKey()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

/**
 * Buat JWT token dengan Web Crypto API (berjalan di Node.js, Edge, dan Browser)
 */
export async function buatTokenAuth(
  session: Omit<AuthSession, 'exp'>,
  maxAge = SESSION_MAX_AGE
): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + maxAge;
  const payload: AuthSession = { ...session, exp };

  const encodedHeader = base64UrlEncode(enc.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(enc.encode(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getKey('sign');
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(dataToSign)
  );
  const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verifikasi JWT token dan kembalikan AuthSession
 */
export async function verifikasiTokenAuth(token: string): Promise<AuthSession | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;
    const enc = new TextEncoder();

    const key = await getKey('verify');
    const signatureBytes = base64UrlDecode(encodedSignature);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as BufferSource,
      enc.encode(dataToVerify)
    );

    if (!valid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(encodedPayload));
    const payload = JSON.parse(payloadJson) as AuthSession;

    // Periksa masa berlaku (expired)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Pasang HTTP-Only Cookie untuk sesi login
 */
export function pasangCookieAuth(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Hapus Cookie sesi saat logout
 */
export function hapusCookieAuth(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Baca sesi dari request incoming
 */
export async function bacaSesiDariRequest(req: NextRequest): Promise<AuthSession | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return await verifikasiTokenAuth(token);
}

/**
 * Helper untuk memproteksi API route berdasarkan sesi & role
 */
export async function wajibSesi(
  req: NextRequest,
  roles?: AuthRole[]
): Promise<{ sesi: AuthSession; error?: never } | { sesi?: never; error: NextResponse }> {
  const sesi = await bacaSesiDariRequest(req);
  if (!sesi) {
    return {
      error: NextResponse.json(
        { error: 'Silakan login terlebih dahulu.', message: 'Silakan login terlebih dahulu.' },
        { status: 401 }
      ),
    };
  }
  if (roles && !roles.includes(sesi.role)) {
    return {
      error: NextResponse.json(
        { error: 'Akses ditolak.', message: 'Akses ditolak.' },
        { status: 403 }
      ),
    };
  }
  return { sesi };
}
