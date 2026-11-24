import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { bacaSesiDariRequest } from "@/lib/auth";
import { batalkanEwalletKadaluarsa } from "@/lib/expiredOrders";
import { bisaDibatalkanPelanggan, userIdDariItem } from "@/lib/orderOwner";

// POST /api/pesanan/[id]/cancel - Pelanggan membatalkan pesanannya sendiri
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sesi = await bacaSesiDariRequest(req);
    if (!sesi) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const pesananId = parseInt(id, 10);
    if (!Number.isFinite(pesananId)) {
      return NextResponse.json({ error: "ID pesanan tidak valid." }, { status: 400 });
    }

    await batalkanEwalletKadaluarsa(pesananId);
    const row = await prisma.pesanan.findUnique({ where: { id: pesananId } });
    if (!row || userIdDariItem(row.item) !== sesi.id) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }
    if (row.status === "dibatalkan") {
      return NextResponse.json({ pesan: `Pesanan #${pesananId} sudah dibatalkan.`, status: row.status });
    }
    if (!bisaDibatalkanPelanggan(row.status, row.item)) {
      const alasan =
        row.status === "selesai"
          ? "Pesanan sudah selesai."
          : row.status === "diproses"
            ? "Pesanan sedang diproses dapur dan tidak bisa dibatalkan. Hubungi gerai."
            : "Pesanan sudah dibayar dan tidak bisa dibatalkan sendiri. Hubungi gerai.";
      return NextResponse.json({ error: alasan }, { status: 409 });
    }

    const hasil = await prisma.pesanan.updateMany({
      where: { id: pesananId, status: row.status },
      data: { status: "dibatalkan" },
    });
    if (hasil.count === 0) {
      return NextResponse.json(
        { error: "Status pesanan baru saja berubah. Muat ulang lalu coba lagi." },
        { status: 409 },
      );
    }
    return NextResponse.json({ pesan: `Pesanan #${pesananId} dibatalkan.`, status: "dibatalkan" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal membatalkan pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
