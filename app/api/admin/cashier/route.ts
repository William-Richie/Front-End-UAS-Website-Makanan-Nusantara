import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const MIN_PASSWORD = 6;

function pesanError(error: unknown, cadangan: string) {
  return error instanceof Error ? error.message : cadangan;
}

// GET /api/admin/cashier -> daftar akun kasir
export async function GET() {
  try {
    const list = await prisma.kasir.findMany({
      orderBy: { created_at: "asc" },
    });
    const data = list.map((k) => ({
      id: k.id,
      nama: k.nama,
      username: k.username,
      gerai: k.gerai,
      is_active: k.is_active,
      created_at: k.created_at,
    }));
    return NextResponse.json({ data });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: pesanError(error, "Gagal memuat akun kasir.") },
      { status: 500 },
    );
  }
}

// POST /api/admin/cashier -> tambah akun kasir baru
export async function POST(req: NextRequest) {
  try {
    const { nama, username, password, gerai } = await req.json();
    const namaBersih = String(nama || "").trim();
    const userBersih = String(username || "")
      .trim()
      .toLowerCase();
    const geraiBersih = String(gerai || "").trim();

    if (!namaBersih || !userBersih || !geraiBersih) {
      return NextResponse.json(
        { error: "Nama, username, dan gerai wajib diisi." },
        { status: 400 },
      );
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(userBersih)) {
      return NextResponse.json(
        {
          error:
            "Username 3-30 karakter: huruf kecil, angka, titik, strip, atau garis bawah.",
        },
        { status: 400 },
      );
    }
    if (typeof password !== "string" || password.length < MIN_PASSWORD) {
      return NextResponse.json(
        { error: `Password minimal ${MIN_PASSWORD} karakter.` },
        { status: 400 },
      );
    }

    const ada = await prisma.map.findFirst({ where: { nama: geraiBersih } });
    if (!ada)
      return NextResponse.json(
        { error: "Gerai tidak ditemukan." },
        { status: 400 },
      );

    const dobel = await prisma.kasir.findUnique({
      where: { username: userBersih },
    });
    if (dobel)
      return NextResponse.json(
        { error: "Username sudah dipakai." },
        { status: 409 },
      );

    const created = await prisma.kasir.create({
      data: {
        nama: namaBersih,
        username: userBersih,
        password: await bcrypt.hash(password, 10),
        gerai: geraiBersih,
      },
    });
    return NextResponse.json(
      { pesan: "Akun kasir berhasil dibuat.", id_baru: created.id },
      { status: 201 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: pesanError(error, "Gagal membuat akun kasir.") },
      { status: 500 },
    );
  }
}

// PUT /api/admin/cashier -> ubah nama, gerai, password atau status aktif
export async function PUT(req: NextRequest) {
  try {
    const { id, nama, gerai, password, is_active } = await req.json();
    if (!id)
      return NextResponse.json(
        { error: "ID kasir wajib diisi." },
        { status: 400 },
      );

    const data: {
      nama?: string;
      gerai?: string;
      password?: string;
      is_active?: boolean;
    } = {};

    if (typeof nama === "string") {
      if (!nama.trim())
        return NextResponse.json(
          { error: "Nama tidak boleh kosong." },
          { status: 400 },
        );
      data.nama = nama.trim();
    }
    if (typeof gerai === "string") {
      const ada = await prisma.map.findFirst({ where: { nama: gerai.trim() } });
      if (!ada)
        return NextResponse.json(
          { error: "Gerai tidak ditemukan." },
          { status: 400 },
        );
      data.gerai = gerai.trim();
    }
    if (typeof password === "string" && password !== "") {
      if (password.length < MIN_PASSWORD) {
        return NextResponse.json(
          { error: `Password minimal ${MIN_PASSWORD} karakter.` },
          { status: 400 },
        );
      }
      data.password = await bcrypt.hash(password, 10);
    }
    if (typeof is_active === "boolean") data.is_active = is_active;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada yang diubah." },
        { status: 400 },
      );
    }

    await prisma.kasir.update({ where: { id: String(id) }, data });
    return NextResponse.json({ pesan: "Akun kasir diperbarui." });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: pesanError(error, "Gagal memperbarui akun kasir.") },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/cashier -> hapus akun kasir
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json(
        { error: "ID kasir wajib diisi." },
        { status: 400 },
      );
    await prisma.kasir.delete({ where: { id: String(id) } });
    return NextResponse.json({ pesan: "Akun kasir dihapus." });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: pesanError(error, "Gagal menghapus akun kasir.") },
      { status: 500 },
    );
  }
}
