// ARSIP: skrip sekali jalan untuk memindahkan data SQLite ke PostgreSQL (sudah selesai dijalankan).
// Untuk menjalankan ulang: hapus tanda //, pasang better-sqlite3, lalu jalankan dengan tsx.

// import 'dotenv/config';
// import { Client } from 'pg';

// const tables = ['menu', 'pesanan', 'faq', 'faq_pertanyaan', 'favorit', 'maps'];

// async function main() {
//   const client = new Client({ connectionString: process.env.DATABASE_URL });
//   await client.connect();

//   for (const t of tables) {
//     const res = await client.query(
//       `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE(MAX(id), 0) + 1, false) AS next FROM ${t}`
//     );
//     console.log(`${t}: nomor berikutnya = ${res.rows[0].next}`);
//   }

//   await client.end();
// }

// main().catch((e) => {
//   console.error(e);
//   process.exit(1);
// });