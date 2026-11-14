import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hitungKetersediaan } from '@/lib/ruangan'; // masih dipakai GET ?terisi=1
import { daftarMeja } from '@/lib/meja';
import { TIPE_DARI_KODE } from '@/lib/mejaTipe';

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
      meja_id,
      catatan,
    } = body;

    if (!gerai || !nama || !email || !telepon || !tanggal || !jumlah || !sesi || !ruangan) {
      return NextResponse.json({ error: 'Semua data reservasi wajib diisi.' }, { status: 400 });
    }

    const tipe = TIPE_DARI_KODE[String(ruangan)];
    if (!tipe) {
      return NextResponse.json({ error: 'Ruangan tidak valid.' }, { status: 400 });
    }
    const mejaId = Number(meja_id);
    const m = (await daftarMeja(String(gerai), String(tanggal), String(sesi), tipe)).find((x) => x.id === mejaId);
    if (!m || !m.bisaDipilih) {
      return NextResponse.json(
        { error: 'Meja ini tidak tersedia pada jam tersebut. Silakan pilih meja lain.' },
        { status: 409 }
      );
    }
    if (Number(jumlah) < m.kapMin || Number(jumlah) > m.kapMaks) {
      return NextResponse.json({ error: `Meja ini untuk ${m.kapMin}-${m.kapMaks} orang.` }, { status: 400 });
    }

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
          meja_id: m.id,
          nomor_meja: m.nomor,
          catatan: catatan ? String(catatan) : null,
          status: 'pending',
        },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        return NextResponse.json(
          { error: 'Meja ini sudah dipesan pada sesi tersebut. Silakan pilih meja atau sesi lain.' },
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
