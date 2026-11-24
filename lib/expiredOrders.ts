import prisma from "@/lib/prisma";
import {
  BATAS_BAYAR_EWALLET_DETIK,
  BATAS_BAYAR_KASIR_DETIK,
} from "@/lib/paymentTimeout";

// Batas bayar sesuai metode: e-wallet 10 menit, bayar di kasir 20 menit.
// COD tidak dihitung karena memang dibayar saat pesanan tiba
function batasBayarDetik(d: Record<string, unknown> | null): number | null {
  if (!d) return null;
  const metodeBayar = String(d.metode_bayar || "");
  if (metodeBayar.startsWith("E-Wallet")) return BATAS_BAYAR_EWALLET_DETIK;
  if (d.metode === "dine-in" && metodeBayar.toLowerCase().includes("kasir")) {
    return BATAS_BAYAR_KASIR_DETIK;
  }
  return null;
}

function bacaItem(item: string): Record<string, unknown> | null {
  try {
    const d = JSON.parse(item);
    return d && typeof d === "object" && !Array.isArray(d) ? d : null;
  } catch {
    return null;
  }
}

function mulaiMs(d: Record<string, unknown> | null, createdAt: Date): number {
  const ms = d?.dibuat_ms;
  return typeof ms === "number" && Number.isFinite(ms) ? ms : createdAt.getTime();
}

export async function batalkanEwalletKadaluarsa(idTertentu?: number): Promise<number> {
  try {
    const sekarang = Date.now();
    const kandidat = await prisma.pesanan.findMany({
      where: {
        status: "menunggu_bayar",
        ...(idTertentu ? { id: idTertentu } : {}),
      },
      select: { id: true, item: true, created_at: true },
    });
    const ids = kandidat
      .filter((k) => {
        const d = bacaItem(k.item);
        const batas = batasBayarDetik(d);
        return batas !== null && sekarang - mulaiMs(d, k.created_at) > batas * 1000;
      })
      .map((k) => k.id);
    if (ids.length === 0) return 0;
    const hasil = await prisma.pesanan.updateMany({
      where: { id: { in: ids }, status: "menunggu_bayar" },
      data: { status: "dibatalkan" },
    });
    return hasil.count;
  } catch (error) {
    console.error("Gagal membatalkan pesanan kadaluarsa:", error);
    return 0;
  }
}
