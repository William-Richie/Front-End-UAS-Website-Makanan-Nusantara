export const PASSWORD_RULES = [
  { id: 'len', label: 'Minimal 8 karakter', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'Ada huruf besar (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Ada huruf kecil (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'num', label: 'Ada angka (0-9)', test: (p: string) => /\d/.test(p) },
];

export function isPasswordStrong(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
}

export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'kasir',
  'cashier',
  'root',
  'system',
  'superuser',
  'papeda',
  'owner',
  'moderator',
  'help',
  'support',
];

export function isUsernameReserved(username: string): boolean {
  const u = username.trim().toLowerCase();
  return RESERVED_USERNAMES.includes(u);
}

export function validateUsername(username: string): string {
  const u = username.trim().toLowerCase();
  if (!u) return 'Username wajib diisi.';
  if (u.length < 3) return 'Username minimal 3 karakter.';
  if (u.length > 20) return 'Username maksimal 20 karakter.';
  if (!/^[a-z0-9_]+$/.test(u)) {
    return 'Username hanya boleh huruf kecil, angka, dan garis bawah (_).';
  }
  if (isUsernameReserved(u)) {
    return `Username '${u}' dilindungi oleh sistem. Silakan pilih username lain.`;
  }
  return '';
}

export function validateEmail(email: string): string {
  const e = email.trim();
  if (!e) return 'Email wajib diisi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return 'Format email belum benar, contoh: nama@email.com';
  return '';
}

export function validateNama(nama: string): string {
  const n = nama.trim();
  if (!n) return 'Nama wajib diisi.';
  if (n.length < 3) return 'Nama minimal 3 karakter.';
  if (n.length > 32) return 'Nama maksimal 32 karakter.';
  return '';
}
