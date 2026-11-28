'use client';

import styles from './Pagination.module.css';

interface PaginationProps {
  page: number; 
  total: number; 
  perPage: number;
  onChange: (page: number) => void;
}

function buatNomor(page: number, jumlah: number): (number | '...')[] {
  const tampil = new Set([1, jumlah, page - 1, page, page + 1]);
  const urut = Array.from(tampil)
    .filter((n) => n >= 1 && n <= jumlah)
    .sort((a, b) => a - b);

  const hasil: (number | '...')[] = [];
  urut.forEach((n, i) => {
    if (i > 0) {
      const sebelum = urut[i - 1];
      if (n - sebelum === 2) hasil.push(sebelum + 1);
      else if (n - sebelum > 2) hasil.push('...');
    }
    hasil.push(n);
  });
  return hasil;
}

export default function Pagination({ page, total, perPage, onChange }: PaginationProps) {
  const jumlahHalaman = Math.max(1, Math.ceil(total / perPage));
  if (jumlahHalaman <= 1) return null;

  const awal = (page - 1) * perPage + 1;
  const akhir = Math.min(page * perPage, total);

  return (
    <nav className={styles.wrap} aria-label="Navigasi halaman">
      <small className={styles.info}>
        Menampilkan {awal}&ndash;{akhir} dari {total}
      </small>

      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        </li>

        {buatNomor(page, jumlahHalaman).map((n, i) =>
          n === '...' ? (
            <li key={`titik-${i}`} className={styles.titik} aria-hidden="true">
              &hellip;
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className={`${styles.btn} ${n === page ? styles.aktif : ''}`}
                onClick={() => onChange(n)}
                aria-label={`Halaman ${n}`}
                aria-current={n === page ? 'page' : undefined}
              >
                {n}
              </button>
            </li>
          )
        )}

        <li>
          <button
            type="button"
            className={styles.btn}
            onClick={() => onChange(page + 1)}
            disabled={page >= jumlahHalaman}
            aria-label="Halaman berikutnya"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
}