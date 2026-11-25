import { NextRequest, NextResponse } from 'next/server';
import { bacaSesiDariRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await bacaSesiDariRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, session: null });
    }

    if (session.role === 'user') {
      const user = await prisma.user.findUnique({ where: { id: session.id } });
      if (!user) {
        return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
      }
      if (!user.is_active) {
        return NextResponse.json({ authenticated: false, blocked: true, session: null }, { status: 403 });
      }
    } else if (session.role === 'cashier') {
      const kasir = await prisma.kasir.findUnique({ where: { id: session.id } });
      if (!kasir || !kasir.is_active) {
        return NextResponse.json({ authenticated: false, session: null }, { status: 401 });
      }
    }

    return NextResponse.json({ authenticated: true, session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membaca sesi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
