export const ambilJson = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .catch(() => null);

export const ambilDaftar = <T>(url: string): Promise<T[]> =>
  ambilJson(url).then((d: { data?: unknown } | null) => (Array.isArray(d?.data) ? (d.data as T[]) : []));
