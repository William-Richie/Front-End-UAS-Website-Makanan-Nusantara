import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { batalkanEwalletKadaluarsa } from '@/lib/expiredOrders';
import { ambilSesiKasirAktif, geraiDariItem } from '@/lib/cashierAuth';

const STATUS_VALID = ['menunggu_bayar', 'pending', 'diproses', 'selesai', 'dibatalkan'];

// GET /api/cashier/pesanan/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesi = await ambilSesiKasirAktif(req);
    if (!sesi) return NextResponse.json({ error: 'Sesi kasir berakhir, silakan login lagi.' }, { status: 401 });

    const { id } = await params;
    const pesananId = parseInt(id, 10);
    if (!Number.isFinite(pesananId)) {
      return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 });
    }

    await batalkanEwalletKadaluarsa(pesananId);
    const row = await prisma.pesanan.findUnique({ where: { id: pesananId } });
    if (!row) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    if (geraiDariItem(row.item) !== sesi.gerai) {
      return NextResponse.json({ error: 'Pesanan ini bukan milik gerai Anda.' }, { status: 403 });
    }

    let statusBayar = '';
    try {
      statusBayar = JSON.parse(row.item)?.status_bayar || '';
    } catch {}
    return NextResponse.json({
      data: {
        id: row.id,
        nama: row.nama,
        item: row.item,
        total: row.total,
        status: row.status,
        status_bayar: statusBayar,
        created_at: row.created_at,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/cashier/pesanan/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sesi = await ambilSesiKasirAktif(req);
    if (!sesi) return NextResponse.json({ error: 'Sesi kasir berakhir, silakan login lagi.' }, { status: 401 });

    const { id } = await params;
    const pesananId = parseInt(id, 10);
    if (!Number.isFinite(pesananId)) {
      return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 });
    }

    const { status, status_bayar, metode_bayar } = await req.json();
    if (status && !STATUS_VALID.includes(String(status))) {
      return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
    }

    const current = await prisma.pesanan.findUnique({ where: { id: pesananId } });
    if (!current) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    if (geraiDariItem(current.item) !== sesi.gerai) {
      return NextResponse.json({ error: 'Pesanan ini bukan milik gerai Anda.' }, { status: 403 });
    }

    const data: { status?: string; item?: string } = {};
    if (status) data.status = String(status);

    if (status_bayar || metode_bayar) {
      try {
        const parsed = JSON.parse(current.item);
        if (parsed && typeof parsed === 'object') {
          if (status_bayar) parsed.status_bayar = String(status_bayar);
          if (metode_bayar) parsed.metode_bayar = String(metode_bayar);
          data.item = JSON.stringify(parsed);
        }
      } catch {}
    }

    const updated = await prisma.pesanan.update({ where: { id: pesananId }, data });
    return NextResponse.json({
      pesan: `Status pesanan berhasil diubah menjadi ${updated.status}`,
      data: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui status pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
