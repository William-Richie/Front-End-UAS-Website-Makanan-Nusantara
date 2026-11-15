'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  note?: string;
  icon?: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: 'field' | 'bare';
  size?: 'md' | 'sm';
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
}

interface Posisi {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  naik: boolean;
}

const JARAK = 6;
const MARGIN_LAYAR = 8;
const TINGGI_IDEAL = 280;
const LEBAR_MIN_BARE = 220;

function indeksAktifPertama(options: SelectOption[], value: string): number {
  const dipilih = options.findIndex((o) => o.value === value && !o.disabled);
  if (dipilih >= 0) return dipilih;
  return options.findIndex((o) => !o.disabled);
}

function geser(options: SelectOption[], dari: number, arah: 1 | -1): number {
  let i = dari;
  for (let n = 0; n < options.length; n++) {
    i += arah;
    if (i < 0 || i >= options.length) return dari;
    if (!options[i].disabled) return i;
  }
  return dari;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  variant = 'field',
  size = 'md',
  disabled = false,
  required = false,
  ariaLabel,
  id,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Posisi | null>(null);
  const [aktif, setAktif] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const ketikRef = useRef({ teks: '', timer: 0 });
  const uid = useId();
  const listId = `${uid}-list`;
  const optId = (i: number) => `${uid}-opt-${i}`;

  const dipilih = options.find((o) => o.value === value) || null;

  const hitungPosisi = (): Posisi | null => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const lebar = Math.max(r.width, variant === 'bare' ? LEBAR_MIN_BARE : 0);
    const kiriMaks = window.innerWidth - lebar - MARGIN_LAYAR;
    const left = Math.max(MARGIN_LAYAR, Math.min(r.left, kiriMaks));
    const ruangBawah = window.innerHeight - r.bottom - JARAK - MARGIN_LAYAR;
    const ruangAtas = r.top - JARAK - MARGIN_LAYAR;
    const naik = ruangBawah < Math.min(TINGGI_IDEAL, 180) && ruangAtas > ruangBawah;
    const maxHeight = Math.max(120, Math.min(TINGGI_IDEAL, naik ? ruangAtas : ruangBawah));
    return {
      left,
      width: lebar,
      maxHeight,
      naik,
      top: naik ? r.top - JARAK : r.bottom + JARAK,
    };
  };

  const buka = () => {
    if (disabled) return;
    setPos(hitungPosisi());
    setAktif(indeksAktifPertama(options, value));
    setOpen(true);
  };

  const tutup = (kembaliFokus = true) => {
    setOpen(false);
    if (kembaliFokus) triggerRef.current?.focus();
  };

  const pilih = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    if (opt.value !== value) onChange(opt.value);
    tutup();
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onReposisi = (e: Event) => {
      if (e.type === 'scroll' && listRef.current?.contains(e.target as Node)) return;
      setPos(hitungPosisi());
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onReposisi);
    window.addEventListener('scroll', onReposisi, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onReposisi);
      window.removeEventListener('scroll', onReposisi, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variant]);

  useEffect(() => {
    if (!open || aktif < 0) return;
    document.getElementById(optId(aktif))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, aktif]);

  useEffect(() => {
    const ketik = ketikRef.current;
    return () => window.clearTimeout(ketik.timer);
  }, []);

  const cariDenganKetik = (huruf: string) => {
    const ketik = ketikRef.current;
    window.clearTimeout(ketik.timer);
    ketik.teks += huruf.toLowerCase();
    ketik.timer = window.setTimeout(() => {
      ketik.teks = '';
    }, 600);
    const mulai = Math.max(aktif, 0);
    const urut = [...options.keys()];
    const putar = ketik.teks.length === 1 ? [...urut.slice(mulai + 1), ...urut.slice(0, mulai + 1)] : urut;
    const ketemu = putar.find(
      (i) => !options[i].disabled && options[i].label.toLowerCase().startsWith(ketik.teks)
    );
    return ketemu ?? -1;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        buka();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const i = cariDenganKetik(e.key);
        if (i >= 0) {
          e.preventDefault();
          setPos(hitungPosisi());
          setAktif(i);
          setOpen(true);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setAktif((a) => (a < 0 ? indeksAktifPertama(options, value) : geser(options, a, 1)));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setAktif((a) => (a < 0 ? indeksAktifPertama(options, value) : geser(options, a, -1)));
        break;
      case 'Home':
        e.preventDefault();
        setAktif(options.findIndex((o) => !o.disabled));
        break;
      case 'End': {
        e.preventDefault();
        const dariAkhir = [...options].reverse().findIndex((o) => !o.disabled);
        setAktif(dariAkhir < 0 ? -1 : options.length - 1 - dariAkhir);
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        pilih(aktif);
        break;
      case 'Escape':
        e.preventDefault();
        tutup();
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const i = cariDenganKetik(e.key);
          if (i >= 0) setAktif(i);
        }
    }
  };

  const gayaList: CSSProperties | undefined = pos
    ? {
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        ...(pos.naik ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
      }
    : undefined;

  const kosong = !dipilih || dipilih.value === '';

  return (
    <div
      className={`${styles.wrap} ${variant === 'bare' ? styles.bare : ''} ${size === 'sm' ? styles.sm : ''} ${className}`}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        className={`${styles.trigger} ${open ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && aktif >= 0 ? optId(aktif) : undefined}
        disabled={disabled}
        onClick={() => (open ? tutup(false) : buka())}
        onKeyDown={onKeyDown}
      >
        {dipilih?.icon && <i className={`${dipilih.icon} ${styles.triggerIcon}`} aria-hidden="true" />}
        <span className={`${styles.label} ${kosong ? styles.placeholder : ''}`}>
          {dipilih ? dipilih.label : placeholder}
        </span>
        <i className={`fa-solid fa-chevron-down ${styles.chevron}`} aria-hidden="true" />
      </button>

      {required && (
        <input
          className={styles.proxy}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          required
          value={value}
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
          aria-label={ariaLabel}
        />
      )}

      {open &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={`${styles.list} ${pos.naik ? styles.listNaik : ''}`}
            style={gayaList}
          >
            {options.length === 0 && <li className={styles.empty}>Tidak ada pilihan</li>}
            {options.map((o, i) => {
              const terpilih = o.value === value;
              return (
                <li
                  key={o.value}
                  id={optId(i)}
                  role="option"
                  aria-selected={terpilih}
                  aria-disabled={o.disabled || undefined}
                  className={[
                    styles.option,
                    terpilih ? styles.terpilih : '',
                    i === aktif ? styles.aktif : '',
                    o.disabled ? styles.optionOff : '',
                  ].join(' ')}
                  onMouseEnter={() => !o.disabled && setAktif(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pilih(i)}
                >
                  {o.icon && <i className={`${o.icon} ${styles.optionIcon}`} aria-hidden="true" />}
                  <span className={styles.optionText}>{o.label}</span>
                  {o.note && <span className={styles.note}>{o.note}</span>}
                  <i className={`fa-solid fa-check ${styles.check}`} aria-hidden="true" />
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
