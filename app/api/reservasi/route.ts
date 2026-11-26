import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hitungKetersediaan } from '@/lib/ruangan'; 
import { daftarMeja } from '@/lib/meja';
import { TIPE_DARI_KODE } from '@/lib/mejaTipe';

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

    if (!user_id) {
      return NextResponse.json(
        { error: 'Sesi login tidak valid. Silakan login ulang.' },
        { status: 401 }
      );
    }

    const userAda = await prisma.user.findUnique({
      where: { id: String(user_id) },
      select: { id: true, is_active: true },
    });

    if (!userAda) {
      return NextResponse.json(
        { error: 'Sesi login tidak valid. Silakan login ulang.' },
        { status: 401 }
      );
    }

    if (!userAda.is_active) {
      return NextResponse.json(
        { error: 'Akun Anda diblokir dan tidak dapat membuat reservasi.', blocked: true },
        { status: 403 }
      );
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

    const hariIni = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tanggal)) || String(tanggal) < hariIni) {
      return NextResponse.json({ error: 'Tanggal reservasi tidak boleh sebelum hari ini.' }, { status: 400 });
    }

    let created;
    try {
      created = await prisma.$transaction(
        async (tx) => {
          const reservasiPending = await tx.reservasi.count({
            where: {
              user_id: String(user_id),
              status: 'pending',
            },
          });

          if (reservasiPending > 0) {
            const error = new Error(
              'Anda masih memiliki reservasi yang menunggu konfirmasi admin. Silakan tunggu hingga reservasi tersebut dikonfirmasi sebelum membuat reservasi baru.'
            ) as Error & { code: string };
            error.code = 'RESERVATION_PENDING';
            throw error;
          }

          const jumlahDikonfirmasi = await tx.reservasi.count({
            where: {
              user_id: String(user_id),
              status: {
                in: ['approved', 'dikonfirmasi'],
              },
            },
          });

          if (jumlahDikonfirmasi >= 2) {
            const error = new Error(
              'Anda sudah mencapai batas maksimal 2 reservasi yang dikonfirmasi. Anda tidak dapat membuat reservasi baru.'
            ) as Error & { code: string };
            error.code = 'RESERVATION_LIMIT_REACHED';
            throw error;
          }

          const reservasiBaru = await tx.reservasi.create({
            data: {
              user_id: String(user_id),
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

          await tx.user.update({
            where: { id: String(user_id) },
            data: { total_reserve: { increment: 1 } },
          });

          return reservasiBaru;
        },
        { isolationLevel: 'Serializable' }
      );
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;

      if (code === 'RESERVATION_PENDING' || code === 'RESERVATION_LIMIT_REACHED') {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : 'Batas reservasi tidak terpenuhi.', code },
          { status: 409 }
        );
      }

      if (code === 'P2002') {
        return NextResponse.json(
          { error: 'Meja ini sudah dipesan pada sesi tersebut. Silakan pilih meja atau sesi lain.' },
          { status: 409 }
        );
      }

      if (code === 'P2034') {
        return NextResponse.json(
          { error: 'Permintaan reservasi sedang diproses. Silakan coba sekali lagi.' },
          { status: 409 }
        );
      }

      throw e;
    }

    return NextResponse.json({ pesan: 'Reservasi berhasil dibuat!', data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat reservasi.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
