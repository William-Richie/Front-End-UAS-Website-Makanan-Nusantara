'use client';

import { useEffect, useRef, useState } from 'react';
import type { BranchMap } from '../Reservation/ReservationSection';
import styles from './BranchSelect.module.css';

interface BranchSelectProps {
  branches: BranchMap[];
  value: string;
  onChange: (value: string) => void;
  getValue?: (b: BranchMap) => string;
  getNote?: (b: BranchMap) => string | null;
  placeholder?: string;
}

export default function BranchSelect({
  branches,
  value,
  onChange,
  getValue = (b) => b.nama,
  getNote,
  placeholder = 'Pilih lokasi gerai',
}: BranchSelectProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const selected = branches.find((b) => getValue(b) === value) || null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pilih = (b: BranchMap) => {
    onChange(getValue(b));
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={boxRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ''} ${selected ? styles.filled : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.pin}>
          <i className="fa-solid fa-store"></i>
        </span>
        <span className={styles.text}>
          {selected ? (
            <>
              <strong>{selected.nama}</strong>
              <small>{selected.alamat}</small>
            </>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <i className={`fa-solid fa-chevron-down ${styles.chevron}`}></i>
      </button>

      {open && (
        <ul className={styles.list} role="listbox">
          {branches.length === 0 && <li className={styles.empty}>Memuat gerai...</li>}
          {branches.map((b) => {
            const aktif = getValue(b) === value;
            const note = getNote ? getNote(b) : null;
            return (
              <li key={b.id} role="option" aria-selected={aktif}>
                <button
                  type="button"
                  className={`${styles.option} ${aktif ? styles.active : ''}`}
                  onClick={() => pilih(b)}
                >
                  <span className={styles.optionPin}>
                    <i className="fa-solid fa-location-dot"></i>
                  </span>
                  <span className={styles.text}>
                    <strong>{b.nama}</strong>
                    <small>{b.alamat}</small>
                  </span>
                  {note && <span className={styles.note}>{note}</span>}
                  <i className={`fa-solid fa-circle-check ${styles.check}`}></i>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
