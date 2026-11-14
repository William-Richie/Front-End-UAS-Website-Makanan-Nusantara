import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { list_ruangan, hitungKetersediaan } from '@/lib/ruangan';

// GET /api/admin/ruangan?gerai=..&tanggal=..&sesi=..
export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const gerai = sp.get('gerai');
    if (!gerai) return NextResponse.json({ data: [] });
    const data = await hitungKetersediaan(gerai, sp.get('tanggal'), sp.get('sesi'));
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat ruangan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Reguler: { gerai, ruangan, jumlah }   VIP: { gerai, ruangan, status }
export async function PUT(req: NextRequest) {
  try {
    const { gerai, ruangan, jumlah, status } = await req.json();
    const def = list_ruangan.find((r) => r.kode === ruangan);
    if (!gerai || !def) {
        return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    }

    const data: { jumlah?: number; status?: boolean } = {};

    if (jumlah !== undefined) {
        if (def.grup !== 'Reguler') {
            return NextResponse.json({ error: 'Jumlah hanya untuk ruangan Reguler.' }, { status: 400 });
        }
        
        const n = Number(jumlah);
        if (!Number.isInteger(n) || n < 0 || n > 50) {
            return NextResponse.json({ error: 'Jumlah harus bilangan bulat 0-50.' }, { status: 400 });
        }

        data.jumlah = n;
    }

    if (status !== undefined) {
        if (typeof status !== 'boolean') {
            return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
        }
        data.status = status;
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'Tidak ada perubahan.' }, { status: 400 });
    }

    const row = await prisma.pengaturanRuangan.upsert({
      where: { gerai_ruangan: { gerai: String(gerai), ruangan } },
      update: data,
      create: { gerai: String(gerai), ruangan, ...data },
    });
    return NextResponse.json({ data: row });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}