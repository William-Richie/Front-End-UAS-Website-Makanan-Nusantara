import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buatKunciVip, list_ruangan, hitungKetersediaan } from '@/lib/ruangan';

// GET /api/reservasi - Mengambil reservasi & cek VIP
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    const whereClause: { email?: string } = {};
    if (email) {
      whereClause.email = email;
    }

    const list = await prisma.reservasi.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    if (searchParams.get('terisi') === '1') {
      const gerai = searchParams.get('gerai');
      const tanggal = searchParams.get('tanggal');
      const sesi = searchParams.get('sesi');

      if (!gerai || !tanggal || !sesi) {
        return NextResponse.json({ terisi: [] });
      }

      const info = await hitungKetersediaan(gerai, tanggal, sesi);
      return NextResponse.json({ terisi: info.filter((r) => !r.tersedia).map((r) => r.ruangan) });
    }

    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const jamSekarangWib = () =>
    new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

// POST /api/reservasi - membuat reservasi baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      gerai,
      nama,
      email,
      telepon,
      tanggal,
      sesi,
      jumlah,
      ruangan,
      catatan,
    } = body;

    if (!gerai || !nama || !email || !telepon || !tanggal || !jumlah || !sesi || !ruangan) {
      return NextResponse.json({ error: 'Semua data reservasi wajib diisi.' }, { status: 400 });
    }
    if (!list_ruangan.some((r) => r.kode === ruangan)) {
      return NextResponse.json({ error: 'Ruangan tidak valid.' }, { status: 400 });
    }

    const info = (await hitungKetersediaan(String(gerai), String(tanggal), String(sesi)))
      .find((r) => r.ruangan === ruangan);

    if (!info || !info.tersedia) {
      return NextResponse.json(
        { error: info && !info.status ? 'Ruangan ini sedang tidak tersedia.' : 'Ruangan ini sudah penuh pada sesi tersebut.' },
        { status: 409 }
      );
    }

    const kunciVip = buatKunciVip(String(gerai), String(tanggal), String(sesi), String(ruangan));

    // tanggal tidak boleh sebelum hari ini (acuan: waktu Jakarta)
    const hariIni = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tanggal)) || String(tanggal) < hariIni) {
      return NextResponse.json({ error: 'Tanggal reservasi tidak boleh sebelum hari ini.' }, { status: 400 });
    }

    let created;
    try {
      created = await prisma.reservasi.create({
        data: {
          user_id: user_id || null,
          gerai: String(gerai),
          nama: String(nama),
          email: String(email),
          telepon: String(telepon),
          tanggal: String(tanggal),
          jam: jamSekarangWib(),
          sesi: String(sesi),
          jumlah: Number(jumlah),
          ruangan: String(ruangan),
          catatan: catatan ? String(catatan) : null,
          status: 'pending',
          vip: kunciVip,
        },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        return NextResponse.json(
          { error: 'Ruangan VIP ini sudah dipesan pada sesi tersebut. Silakan pilih ruangan atau sesi lain.' },
          { status: 409 }
        );
      }
      throw e;
    }

    if (user_id) {
      await prisma.user.update({
        where: { id: user_id },
        data: { total_reserve: { increment: 1 } },
      })
      .catch(() => {});
    }

    return NextResponse.json({ pesan: 'Reservasi berhasil dibuat!', data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}