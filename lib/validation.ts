export const PASSWORD_RULES = [
  { id: 'len', label: 'Minimal 8 karakter', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'Ada huruf besar (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Ada huruf kecil (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'num', label: 'Ada angka (0-9)', test: (p: string) => /\d/.test(p) },
];

export function isPasswordStrong(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
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
