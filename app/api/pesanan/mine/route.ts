import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { bacaSesiDariRequest } from "@/lib/auth";
import { batalkanEwalletKadaluarsa } from "@/lib/expiredOrders";
import {
  kondisiItemMilikUser,
  statusBayarDariItem,
  userIdDariItem,
} from "@/lib/orderOwner";

// GET /api/pesanan/mine - Riwayat + pesanan berjalan milik pelanggan yang sedang login
export async function GET(req: NextRequest) {
  try {
    const sesi = await bacaSesiDariRequest(req);
    if (!sesi) {
      return NextResponse.json(
        { error: "Silakan login untuk melihat pesanan Anda." },
        { status: 401 },
      );
    }

    await batalkanEwalletKadaluarsa();
    const rows = await prisma.pesanan.findMany({
      where: { item: kondisiItemMilikUser(sesi.id) },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    const data = rows
      .filter((r) => userIdDariItem(r.item) === sesi.id)
      .map((r) => ({
        id: r.id,
        nama: r.nama,
        item: r.item,
        total: r.total,
        status: r.status,
        status_bayar: statusBayarDariItem(r.item),
        created_at: r.created_at,
      }));
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal memuat pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
