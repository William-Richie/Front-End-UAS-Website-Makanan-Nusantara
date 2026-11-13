// Tarif ongkir Papeda. Ubah angka di sini kalau mau ganti tarif.
export const ONGKIR_TARIF = {
  jarakDasarKm: 3,     // 3 km pertama kena tarif dasar
  tarifDasar: 8000,    // Rp 8.000 untuk <= 3 km
  tarifPerKm: 2000,    // tiap tambahan 1 km (dibulatkan ke atas)
  maksKm: 15,          // di atas 15 km tidak dilayani
  faktorJalan: 1.3,    // jarak garis lurus x 1,3 = perkiraan jarak lewat jalan
};

// pilihan manual kalau pelanggan tidak mau / tidak bisa membagikan lokasi (km = batas atas zona)
export const ZONA_MANUAL = [
  { km: 2, label: '0 - 2 km' },
  { km: 5, label: '2 - 5 km' },
  { km: 8, label: '5 - 8 km' },
  { km: 12, label: '8 - 12 km' },
  { km: 15, label: '12 - 15 km' },
];

const rad = (d: number) => (d * Math.PI) / 180;

// jarak garis lurus (haversine) lalu dikali faktor jalan, hasil dalam km
export function hitungJarakKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  const lurus = 2 * R * Math.asin(Math.sqrt(a));
  return lurus * ONGKIR_TARIF.faktorJalan;
}

// null = di luar jangkauan pengantaran
export function hitungOngkir(km: number): number | null {
  const { jarakDasarKm, tarifDasar, tarifPerKm, maksKm } = ONGKIR_TARIF;
  if (km > maksKm) return null;
  if (km <= jarakDasarKm) return tarifDasar;
  return tarifDasar + Math.ceil(km - jarakDasarKm) * tarifPerKm;
}

export const formatKm = (km: number) => `${km.toFixed(1).replace('.', ',')} km`;