import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { batalkanEwalletKadaluarsa } from '@/lib/expiredOrders';
import { ambilSesiKasirAktif, geraiDariItem } from '@/lib/cashierAuth';

// GET /api/cashier/pesanan
export async function GET(req: NextRequest) {
  try {
    const sesi = await ambilSesiKasirAktif(req);
    if (!sesi) return NextResponse.json({ error: 'Sesi kasir berakhir, silakan login lagi.' }, { status: 401 });

    await batalkanEwalletKadaluarsa();
    const list = await prisma.pesanan.findMany({ orderBy: { created_at: 'desc' } });
    const milikGerai = list.filter((p) => geraiDariItem(p.item) === sesi.gerai);
    return NextResponse.json({ data: milikGerai });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesi = await ambilSesiKasirAktif(req);
    if (!sesi) return NextResponse.json({ error: 'Sesi kasir berakhir, silakan login lagi.' }, { status: 401 });

    const { nama, items } = await req.json();

    const namaBersih = String(nama ?? '').trim();
    if (!namaBersih) {
      return NextResponse.json({ error: 'Nama pelanggan wajib diisi.' }, { status: 400 });
    }
    if (namaBersih.length > 60) {
      return NextResponse.json({ error: 'Nama pelanggan maksimal 60 karakter.' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong.' }, { status: 400 });
    }

    const itemValid = items.every(
      (x: { id?: unknown; harga?: unknown; quantity?: unknown }) =>
        Number.isInteger(x?.id) &&
        typeof x?.harga === 'number' && Number.isFinite(x.harga) && x.harga >= 0 &&
        Number.isInteger(x?.quantity) && (x.quantity as number) > 0 && (x.quantity as number) <= 99,
    );
    if (!itemValid) {
      return NextResponse.json({ error: 'Data item pesanan tidak valid.' }, { status: 400 });
    }

    const total = items.reduce((t: number, x: { harga: number; quantity: number }) => t + x.harga * x.quantity, 0);

    const dibuat = await prisma.pesanan.create({
      data: {
        nama: namaBersih,
        total,
        status: 'menunggu_bayar',
        item: JSON.stringify({
          metode: 'dine-in',
          metode_bayar: 'Bayar di Kasir',
          status_bayar: 'Belum Dibayar',
          gerai: sesi.gerai,
          daftar_menu: items,
          ongkir: 0,
        }),
      },
    });
    return NextResponse.json({ data: dibuat }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan pesanan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}