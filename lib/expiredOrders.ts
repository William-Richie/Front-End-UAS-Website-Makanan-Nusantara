import prisma from "@/lib/prisma";
import { BATAS_BAYAR_EWALLET_DETIK } from "@/lib/paymentTimeout";

export async function batalkanEwalletKadaluarsa(idTertentu?: number) {
  try {
    const batas = new Date(Date.now() - BATAS_BAYAR_EWALLET_DETIK * 1000);
    const kandidat = await prisma.pesanan.findMany({
      where: {
        status: "menunggu_bayar",
        created_at: { lt: batas },
        ...(idTertentu ? { id: idTertentu } : {}),
      },
      select: { id: true, item: true },
    });
    const ids = kandidat
      .filter((k) => {
        try {
          return String(JSON.parse(k.item)?.metode_bayar || "").startsWith(
            "E-Wallet",
          );
        } catch {
          return false;
        }
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
