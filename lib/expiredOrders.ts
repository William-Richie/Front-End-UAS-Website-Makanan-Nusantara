import prisma from "@/lib/prisma";
import {
  BATAS_BAYAR_EWALLET_DETIK,
  BATAS_BAYAR_KASIR_DETIK,
} from "@/lib/paymentTimeout";

// Batas bayar sesuai metode: e-wallet 10 menit, bayar di kasir 20 menit.
// COD tidak dihitung karena memang dibayar saat pesanan tiba.
function batasBayarDetik(item: string): number | null {
  try {
    const d = JSON.parse(item);
    const metodeBayar = String(d?.metode_bayar || "");
    if (metodeBayar.startsWith("E-Wallet")) return BATAS_BAYAR_EWALLET_DETIK;
    if (d?.metode === "dine-in" && metodeBayar.toLowerCase().includes("kasir")) {
      return BATAS_BAYAR_KASIR_DETIK;
    }
  } catch {}
  return null;
}

// Nama fungsi dipertahankan supaya pemanggilnya (/api/pesanan dan /api/pesanan/[id]) tidak perlu diubah,
// tapi sekarang yang dibatalkan otomatis adalah e-wallet DAN bayar di kasir yang belum dibayar.
export async function batalkanEwalletKadaluarsa(idTertentu?: number) {
  try {
    const sekarang = Date.now();
    const palingCepat = new Date(
      sekarang - Math.min(BATAS_BAYAR_EWALLET_DETIK, BATAS_BAYAR_KASIR_DETIK) * 1000,
    );
    const kandidat = await prisma.pesanan.findMany({
      where: {
        status: "menunggu_bayar",
        created_at: { lt: palingCepat },
        ...(idTertentu ? { id: idTertentu } : {}),
      },
      select: { id: true, item: true, created_at: true },
    });
    const ids = kandidat
      .filter((k) => {
        const batas = batasBayarDetik(k.item);
        return batas !== null && sekarang - k.created_at.getTime() > batas * 1000;
      })
      .map((k) => k.id);
    if (ids.length > 0) {
      await prisma.pesanan.updateMany({
        where: { id: { in: ids }, status: "menunggu_bayar" },
        data: { status: "dibatalkan" },
      });
    }
  } catch {}
}
