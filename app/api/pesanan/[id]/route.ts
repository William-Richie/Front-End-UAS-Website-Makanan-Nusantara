import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/pesanan/[id] - Cek status pesanan
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await prisma.pesanan.findUnique({ where: { id: parseInt(id, 10) } });
    if (!row) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });

    let statusBayar = '';
    try {
      statusBayar = JSON.parse(row.item)?.status_bayar || '';
    } catch {
    }
    return NextResponse.json({ data: { id: row.id, status: row.status, status_bayar: statusBayar } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/pesanan/[id] - Update status pesanan
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, status_bayar, metode_bayar } = await req.json();
    const pesananId = parseInt(id, 10);

    const data: { status?: string; item?: string } = {};
    if (status) data.status = String(status);

    if (status_bayar || metode_bayar) {
      const current = await prisma.pesanan.findUnique({ where: { id: pesananId } });
      if (current) {
        try {
          const parsed = JSON.parse(current.item);
          if (parsed && typeof parsed === 'object') {
            if (status_bayar) parsed.status_bayar = String(status_bayar);
            if (metode_bayar) parsed.metode_bayar = String(metode_bayar);
            data.item = JSON.stringify(parsed);
          }
        } catch {
        }
      }
    }

    const updated = await prisma.pesanan.update({ where: { id: pesananId }, data });
    return NextResponse.json({ pesan: `Status pesanan berhasil diubah menjadi ${updated.status}`, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui status pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
