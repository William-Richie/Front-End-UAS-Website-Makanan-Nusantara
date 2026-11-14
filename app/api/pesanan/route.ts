import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { batalkanEwalletKadaluarsa } from "@/lib/expiredOrders";

// GET /api/pesanan - Daftar pesanan aktif
export async function GET() {
  try {
    await batalkanEwalletKadaluarsa();
    const list = await prisma.pesanan.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ data: list });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal memuat pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/pesanan - Membuat pesanan baru
export async function POST(req: NextRequest) {
  try {
    const { nama, item, total, status } = await req.json();

    const created = await prisma.pesanan.create({
      data: {
        nama: String(nama || "Pelanggan"),
        item: typeof item === "string" ? item : JSON.stringify(item),
        total: Number(total || 0),
        status: status || "pending",
      },
    });

    return NextResponse.json(
      { pesan: "Pesanan berhasil dibuat", pesanan: created },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/pesanan - Hapus semua pesanan yang dibatalkan sekaligus
export async function DELETE() {
  try {
    const hasil = await prisma.pesanan.deleteMany({
      where: { status: "dibatalkan" },
    });
    return NextResponse.json({
      pesan: `${hasil.count} pesanan dibatalkan dihapus.`,
      jumlah: hasil.count,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal menghapus pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
