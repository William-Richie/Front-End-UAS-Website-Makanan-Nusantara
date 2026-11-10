import prisma from '@/lib/prisma';

export interface FavoritData {
  slot: number;
  menu_id: number | null;
  nama_makanan: string | null;
  deskripsi: string | null;
  gambar: string | null;
  pedas: number;
  status: boolean | null;
}

export async function hitungTerlaris(batas = 5): Promise<FavoritData[]> {
  const [rows, menus] = await Promise.all([
    prisma.pesanan.findMany({ where: { status: 'selesai' }, select: { item: true } }),
    prisma.menu.findMany({ where: { status: true } }),
  ]);

  const terjual: Record<string, number> = {};
  const tambah = (nama: string, qty: number) => {
    const kunci = nama.trim().toLowerCase();
    if (kunci) terjual[kunci] = (terjual[kunci] || 0) + qty;
  };

  rows.forEach((r) => {
    try {
      const p = JSON.parse(r.item);
      if (Array.isArray(p?.daftar_menu)) {
        p.daftar_menu.forEach((m: { nama_makanan?: string; quantity?: number }) =>
          tambah(m.nama_makanan || '', m.quantity || 1)
        );
        return;
      }
    } catch {
      // bukan JSON, lanjut baca sebagai teks biasa
    }

    const teks = String(r.item || '').replace(/\[[^\]]*\]\s*/g, '').trim();
    teks
      .split(/,(?![^(]*\))/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((raw) => {
        const cocok = raw.match(/^(.*?)(?:\s*\((?:x?(\d+)|(\d+)x)\))?$/i);
        const nama = cocok && cocok[1] ? cocok[1].trim() : raw;
        const qty = cocok && (cocok[2] || cocok[3]) ? parseInt(cocok[2] || cocok[3], 10) : 1;
        tambah(nama, qty);
      });
  });

  return menus
    .map((m) => ({ menu: m, qty: terjual[m.nama_makanan.trim().toLowerCase()] || 0 }))
    .filter((x) => x.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, batas)
    .map((x, i) => ({
      slot: i + 1,
      menu_id: x.menu.id,
      nama_makanan: x.menu.nama_makanan,
      deskripsi: x.menu.deskripsi || null,
      gambar: x.menu.gambar || null,
      pedas: x.menu.pedas || 0,
      status: x.menu.status,
    }));
}
