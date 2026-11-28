export function userIdDariItem(item: string): string {
  try {
    const d = JSON.parse(item);
    return d && typeof d === "object" ? String(d.user_id || "") : "";
  } catch {
    return "";
  }
}

export function kondisiItemMilikUser(userId: string) {
  return { contains: `"user_id":"${userId}"` };
}

export function statusBayarDariItem(item: string): string {
  try {
    const d = JSON.parse(item);
    return d && typeof d === "object" ? String(d.status_bayar || "") : "";
  } catch {
    return "";
  }
}

export function bisaDibatalkanPelanggan(status: string, item: string): boolean {
  if (status === "menunggu_bayar") return true;
  if (status === "pending") return statusBayarDariItem(item) !== "Lunas";
  return false;
}
