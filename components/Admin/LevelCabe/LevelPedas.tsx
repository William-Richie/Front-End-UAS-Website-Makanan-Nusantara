'use client';

import { useState } from 'react';
import styles from './LevelPedas.module.css';

interface Props {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}

interface Efek {
  id: number;
  dari: number;
  ke: number;
  naik: boolean;
}

export default function LevelPedas({ value, onChange, max = 5 }: Props) {
  const [hover, setHover] = useState(0);
  const [efek, setEfek] = useState<Efek | null>(null);
  const tampil = hover || value;

  const pilih = (n: number) => {
    const baru = value === n ? n - 1 : n;
    setEfek((prev) => ({
      id: (prev?.id ?? 0) + 1,
      dari: value,
      ke: baru,
      naik: baru > value,
    }));
    setHover(0);
    onChange(baru);
  };

  return (
    <div className={styles.wrap} onMouseLeave={() => setHover(0)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        const kena =
          efek &&
          (efek.naik
            ? n > efek.dari && n <= efek.ke
            : n > efek.ke && n <= efek.dari);
        const kelasEfek = kena ? (efek.naik ? styles.pop : styles.turun) : '';
        const jeda = kena && efek.naik ? (n - efek.dari - 1) * 70 : 0;

        return (
          <button
            key={n}
            type="button"
            className={`${styles.cabai} ${n <= tampil ? styles.menyala : ''}`}
            aria-label={`Level pedas ${n}`}
            aria-pressed={n <= value}
            onMouseEnter={() => setHover(n)}
            onClick={() => pilih(n)}
          >
            <span
              key={kena ? efek.id : 'diam'}
              className={`${styles.efek} ${kelasEfek}`}
              style={{ animationDelay: `${jeda}ms` }}
            >
              <i className={`fa-solid fa-pepper-hot ${styles.ikon}`}></i>
            </span>
          </button>
        );
      })}
      <span className={styles.teks}>{value === 0 ? 'Tidak pedas' : `Level ${value}`}</span>
    </div>
  );
}