export const ONGKIR_TARIF = {
  jarakDasarKm: 3,
  tarifDasar: 8000,
  tarifPerKm: 2000,
  maksKm: 20,
  faktorJalan: 1.3,
};

const rad = (d: number) => (d * Math.PI) / 180;

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