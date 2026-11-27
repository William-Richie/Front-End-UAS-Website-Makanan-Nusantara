import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { wajibSesi } from "@/lib/auth";
import { batalkanEwalletKadaluarsa } from "@/lib/expiredOrders";
import { userIdDariItem } from "@/lib/orderOwner";

// GET /api/pesanan/[id] - Cek status pesanan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await wajibSesi(req);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const pesananId = parseInt(id, 10);
    if (!Number.isFinite(pesananId)) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid." },
        { status: 400 },
      );
    }

    await batalkanEwalletKadaluarsa(pesananId);
    const row = await prisma.pesanan.findUnique({ where: { id: pesananId } });
    if (!row)
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    if (auth.sesi.role === "user" && userIdDariItem(row.item) !== auth.sesi.id) {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 },
      );
    }

    let statusBayar = "";
    try {
      statusBayar = JSON.parse(row.item)?.status_bayar || "";
    } catch {}
    return NextResponse.json({
      data: {
        id: row.id,
        nama: row.nama,
        item: row.item,
        total: row.total,
        status: row.status,
        status_bayar: statusBayar,
        created_at: row.created_at,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal memuat pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/pesanan/[id] - Update status pesanan
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await wajibSesi(req);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const { status, status_bayar, metode_bayar } = await req.json();
    const pesananId = parseInt(id, 10);
    if (!Number.isFinite(pesananId)) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid." },
        { status: 400 },
      );
    }

    await batalkanEwalletKadaluarsa(pesananId);
    const current = await prisma.pesanan.findUnique({
      where: { id: pesananId },
    });
    if (!current) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }
    if (auth.sesi.role === "user" && userIdDariItem(current.item) !== auth.sesi.id) {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 },
      );
    }
    if (current.status === "dibatalkan" || current.status === "selesai") {
      if (status && String(status) === current.status && !status_bayar && !metode_bayar) {
        return NextResponse.json({
          pesan: `Pesanan sudah berstatus ${current.status}`,
          data: current,
        });
      }
      return NextResponse.json(
        {
          error:
            current.status === "dibatalkan"
              ? "Pesanan sudah dibatalkan (atau waktu pembayaran habis) dan tidak bisa diubah lagi."
              : "Pesanan sudah selesai dan tidak bisa diubah lagi.",
        },
        { status: 409 },
      );
    }

    const data: { status?: string; item?: string } = {};
    if (status) data.status = String(status);

    if (status_bayar || metode_bayar) {
      try {
        const parsed = JSON.parse(current.item);
        if (parsed && typeof parsed === "object") {
          if (status_bayar) parsed.status_bayar = String(status_bayar);
          if (metode_bayar) parsed.metode_bayar = String(metode_bayar);
          data.item = JSON.stringify(parsed);
        }
      } catch {}
    }

    const updated = await prisma.pesanan.update({
      where: { id: pesananId },
      data,
    });
    return NextResponse.json({
      pesan: `Status pesanan berhasil diubah menjadi ${updated.status}`,
      data: updated,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui status pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/pesanan/[id] - Hapus pesanan (hanya yang berstatus dibatalkan)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await wajibSesi(req, ["admin"]);
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const pesananId = parseInt(id, 10);
    if (!Number.isFinite(pesananId)) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid." },
        { status: 400 },
      );
    }

    const row = await prisma.pesanan.findUnique({ where: { id: pesananId } });
    if (!row)
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    if (row.status !== "dibatalkan") {
      return NextResponse.json(
        { error: "Hanya pesanan yang dibatalkan yang bisa dihapus." },
        { status: 400 },
      );
    }

    await prisma.pesanan.delete({ where: { id: pesananId } });
    return NextResponse.json({
      pesan: `Pesanan #${pesananId} berhasil dihapus.`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal menghapus pesanan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
