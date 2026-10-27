// ARSIP: skrip sekali jalan untuk memindahkan data SQLite ke PostgreSQL (sudah selesai dijalankan).
// Untuk menjalankan ulang: hapus tanda //, pasang better-sqlite3, lalu jalankan dengan tsx.

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import 'dotenv/config';
// import Database from 'better-sqlite3';
// import { db } from '../../prisma/db';

// const sqlite = new Database('./dev.db', { readonly: true });

// const rows = (table: string): Record<string, any>[] =>
//   sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, any>[];

// const toDate = (v: unknown): Date => {
//   if (v === null || v === undefined || v === '') return new Date();
//   if (typeof v === 'number') return new Date(v);
//   const s = String(v);
//   return /^\d+$/.test(s) ? new Date(Number(s)) : new Date(s);
// };
// const bool = (v: unknown) => v === 1 || v === true || v === '1';
// const str = (v: unknown) => (v === null || v === undefined ? null : String(v));

// async function main() {
//   const userIds = new Set<string>();
//   const menuIds = new Set<number>();

//   // 1) users
//   for (const r of rows('users')) {
//     userIds.add(r.id);
//     const ada =
//       (await db.orm.public.User.where({ id: r.id }).first()) ||
//       (await db.orm.public.User.where({ email: r.email }).first());
//     if (ada) continue;
//     await db.orm.public.User.create({
//       id: r.id,
//       nama: r.nama,
//       email: r.email,
//       password: r.password,
//       total_reserve: r.total_reserve ?? 0,
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 2) menu
//   for (const r of rows('menu')) {
//     menuIds.add(r.id);
//     if (await db.orm.public.Menu.where({ id: r.id }).first()) continue;
//     await db.orm.public.Menu.create({
//       id: r.id,
//       nama_kategori: r.nama_kategori,
//       nama_makanan: r.nama_makanan,
//       harga: r.harga,
//       gambar: r.gambar,
//       deskripsi: str(r.deskripsi),
//       pedas: r.pedas ?? 0,
//       status: bool(r.status),
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 3) pesanan
//   for (const r of rows('pesanan')) {
//     if (await db.orm.public.Pesanan.where({ id: r.id }).first()) continue;
//     await db.orm.public.Pesanan.create({
//       id: r.id,
//       nama: r.nama,
//       item: r.item,
//       total: r.total,
//       status: r.status ?? 'pending',
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 4) reservasi
//   for (const r of rows('reservasi')) {
//     if (await db.orm.public.Reservasi.where({ id: r.id }).first()) continue;
//     await db.orm.public.Reservasi.create({
//       id: r.id,
//       user_id: r.user_id && userIds.has(r.user_id) ? r.user_id : null,
//       gerai: r.gerai,
//       nama: r.nama,
//       telepon: r.telepon,
//       email: r.email,
//       tanggal: r.tanggal,
//       jam: r.jam,
//       sesi: r.sesi,
//       jumlah: r.jumlah,
//       ruangan: r.ruangan,
//       catatan: str(r.catatan),
//       status: r.status ?? 'pending',
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 5) faq
//   for (const r of rows('faq')) {
//     if (await db.orm.public.Faq.where({ id: r.id }).first()) continue;
//     await db.orm.public.Faq.create({
//       id: r.id,
//       pertanyaan: r.pertanyaan,
//       jawaban: r.jawaban,
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 6) faq_pertanyaan
//   for (const r of rows('faq_pertanyaan')) {
//     if (await db.orm.public.FaqPertanyaan.where({ id: r.id }).first()) continue;
//     await db.orm.public.FaqPertanyaan.create({
//       id: r.id,
//       nama: r.nama,
//       email: r.email,
//       pertanyaan: r.pertanyaan,
//       dibaca: bool(r.dibaca),
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 7) favorit
//   for (const r of rows('favorit')) {
//     if (!menuIds.has(r.menu_id)) continue;
//     if (await db.orm.public.Favorit.where({ id: r.id }).first()) continue;
//     await db.orm.public.Favorit.create({
//       id: r.id,
//       menu_id: r.menu_id,
//       slot: r.slot,
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 8) maps
//   for (const r of rows('maps')) {
//     if (await db.orm.public.Map.where({ id: r.id }).first()) continue;
//     await db.orm.public.Map.create({
//       id: r.id,
//       latitude: r.latitude,
//       longitude: r.longitude,
//       nama: r.nama,
//       alamat: r.alamat,
//       created_at: toDate(r.created_at),
//     });
//   }

//   // 9-11) tabel konten web, konten footer, statistik
//   for (const r of rows('konten_web')) {
//     const data = {
//       teks_hero: str(r.teks_hero),
//       teks_about: str(r.teks_about),
//       created_at: toDate(r.created_at),
//     };
//     const ada = await db.orm.public.KontenWeb.where({ id: 1 }).first();
//     if (ada) await db.orm.public.KontenWeb.where({ id: 1 }).update(data);
//     else await db.orm.public.KontenWeb.create({ id: 1, ...data });
//   }

//   for (const r of rows('konten_footer')) {
//     const data = {
//       judul: str(r.judul),
//       copyright: str(r.copyright),
//       link_ig: str(r.link_ig),
//       link_tiktok: str(r.link_tiktok),
//       link_wa: str(r.link_wa),
//       link_linkedin: str(r.link_linkedin),
//       email: str(r.email),
//       created_at: toDate(r.created_at),
//     };
//     const ada = await db.orm.public.KontenFooter.where({ id: 1 }).first();
//     if (ada) await db.orm.public.KontenFooter.where({ id: 1 }).update(data);
//     else await db.orm.public.KontenFooter.create({ id: 1, ...data });
//   }

//   for (const r of rows('statistik')) {
//     const data = {
//       jumlah_pengunjung: r.jumlah_pengunjung ?? 0,
//       created_at: toDate(r.created_at),
//     };
//     const ada = await db.orm.public.Statistik.where({ id: 1 }).first();
//     if (ada) await db.orm.public.Statistik.where({ id: 1 }).update(data);
//     else await db.orm.public.Statistik.create({ id: 1, ...data });
//   }

//   console.log('Selesai. Jumlah baris di SQLite:');
//   for (const t of ['users', 'menu', 'pesanan', 'reservasi', 'faq', 'faq_pertanyaan', 'favorit', 'maps']) {
//     console.log(`  ${t}: ${rows(t).length}`);
//   }
// }

// main()
//   .then(() => process.exit(0))
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   });