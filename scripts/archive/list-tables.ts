// ARSIP: skrip sekali jalan untuk memindahkan data SQLite ke PostgreSQL (sudah selesai dijalankan).
// Untuk menjalankan ulang: hapus tanda //, pasang better-sqlite3, lalu jalankan dengan tsx.

// /* eslint-disable @typescript-eslint/no-explicit-any */
// import Database from 'better-sqlite3';

// const sqlite = new Database('./dev.db', { readonly: true });
// const tables = sqlite
//   .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
//   .all() as any[];

// for (const t of tables) {
//   const count = sqlite.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get() as any;
//   console.log(`${t.name}: ${count.n} baris`);
// }