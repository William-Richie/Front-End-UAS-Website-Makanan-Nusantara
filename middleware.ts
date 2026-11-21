import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, verifikasiTokenAuth } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isCashierRoute = pathname === '/cashier' || pathname.startsWith('/cashier/');

  if (!isAdminRoute && !isCashierRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = token ? await verifikasiTokenAuth(token) : null;

  // Proteksi rute Admin
  if (isAdminRoute) {
    if (!session || session.role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('auth', 'login');
      url.searchParams.set('pesan', 'Akses ditolak: Silakan login sebagai Admin terlebih dahulu.');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Proteksi rute Kasir
  if (isCashierRoute) {
    if (!session || session.role !== 'cashier') {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('auth', 'login');
      url.searchParams.set('pesan', 'Akses ditolak: Silakan login sebagai Kasir terlebih dahulu.');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*'],
};
