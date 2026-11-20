import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export interface RingkasanPendapatan {
  total: number;
  pesanan: number;
  item: number;
  rata: number;
}

export interface GrafikPoint {
  label: string;
  total: number;
}

export interface MenuTerlaris {
  nama: string;
  qty: number;
  pendapatan: number;
}

export interface LaporanHari {
  tanggal: string;
  pesanan: number;
  item: number;
  pendapatan: number;
}

// Semua perhitungan hari memakai waktu Jakarta (WIB), bukan zona waktu server, supaya total
// dan rincian harian selalu sama (server di Vercel memakai UTC, laptop memakai WIB).
const WIB = 'Asia/Jakarta';
const kunciWib = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: WIB });
const jamWib = (d: Date) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: WIB, hour: '2-digit', hourCycle: 'h23' }).format(d));

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7';

    const n = range === 'hari' ? 1 : range === '30' ? 30 : 7;

    // n hari terakhir (hari ini termasuk), diurutkan dari yang paling lama
    const kunciHari = Array.from({ length: n }, (_, k) => kunciWib(new Date(Date.now() - (n - 1 - k) * 86400000)));
    const startDate = new Date(`${kunciHari[0]}T00:00:00+07:00`);

    const [rows, menus] = await Promise.all([
      prisma.pesanan.findMany({
        where: {
          status: 'selesai',
          created_at: {
            gte: startDate,
          },
        },
      }),
      prisma.menu.findMany({
        select: {
          nama_makanan: true,
          harga: true,
        },
      }),
    ]);
      
    const hargaMap: Record<string, number> = {};
    menus.forEach((m) => {
      hargaMap[m.nama_makanan.trim().toLowerCase()] = m.harga;
    });

    const perHari: Record<string, LaporanHari> = {};
    for (const key of kunciHari) {
      perHari[key] = { tanggal: key, pesanan: 0, item: 0, pendapatan: 0 };
    }

    const perJam: GrafikPoint[] = Array.from({ length: 24 }, (_, i) => ({
      label: String(i).padStart(2, '0') + ':00',
      total: 0,
    }));

    const perMenu: Record<string, MenuTerlaris> = {};
    let total = 0;
    let totalItem = 0;
    let totalPesanan = 0;

    rows.forEach((r) => {
      const t = kunciWib(r.created_at);
      // di luar rentang yang ditampilkan tidak dihitung, sehingga total = jumlah rincian harian
      if (!perHari[t]) return;
      const nilai = Number(r.total) || 0;

      let itemsCountInOrder = 0;

      try {
        const parsed = JSON.parse(r.item);
        if (parsed.daftar_menu && Array.isArray(parsed.daftar_menu)) {
          parsed.daftar_menu.forEach((item: { nama_makanan: string; quantity: number; harga: number }) => {
            const qty = item.quantity || 1;
            itemsCountInOrder += qty;
            const key = (item.nama_makanan || '').toLowerCase();
            if (!perMenu[key]) {
              perMenu[key] = { nama: item.nama_makanan, qty: 0, pendapatan: 0 };
            }
            perMenu[key].qty += qty;
            perMenu[key].pendapatan += (hargaMap[key] || item.harga || 0) * qty;
          });
        }
      } catch {
        const itemText = String(r.item || '').replace(/\[[^\]]*\]\s*/g, '').trim();
        const daftar = itemText.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean);

        daftar.forEach((namaRaw) => {
          const match = namaRaw.match(/^(.*?)(?:\s*\((?:x?(\d+)|(\d+)x)\))?$/i);
          const nama = match && match[1] ? match[1].trim() : namaRaw.trim();
          const qty = match && (match[2] || match[3]) ? parseInt(match[2] || match[3], 10) : 1;
          itemsCountInOrder += qty;
          const key = nama.toLowerCase();
          if (!perMenu[key]) {
            perMenu[key] = { nama, qty: 0, pendapatan: 0 };
          }
          perMenu[key].qty += qty;
          perMenu[key].pendapatan += (hargaMap[key] || 0) * qty;
        });
      }

      if (perHari[t]) {
        perHari[t].pesanan++;
        perHari[t].item += itemsCountInOrder;
        perHari[t].pendapatan += nilai;
      }

      const hour = jamWib(r.created_at);
      if (perJam[hour]) {
        perJam[hour].total += nilai;
      }

      total += nilai;
      totalItem += itemsCountInOrder;
      totalPesanan++;
    });

    const hariArray = Object.values(perHari);

    return NextResponse.json({
      ringkasan: {
        total,
        pesanan: totalPesanan,
        item: totalItem,
        rata: totalPesanan ? Math.round(total / totalPesanan) : 0,
      },
      grafik: range === 'hari' ? perJam : hariArray.map((h) => ({ label: h.tanggal, total: h.pendapatan })),
      terlaris: Object.values(perMenu).sort((a, b) => b.qty - a.qty).slice(0, 5),
      laporan: [...hariArray].reverse(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat laporan pendapatan.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
