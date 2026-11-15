'use client';

import { useRef, type KeyboardEvent } from 'react';

interface Props {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  garisBawah?: boolean;   // tampilkan tombol underline
}

export default function EditorTeks({ id, value, onChange, rows, placeholder, garisBawah = true }: Props) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  const bungkus = (tanda: string) => {
    const el = ref.current;
    if (!el) return;
    const a = el.selectionStart ?? 0;
    const b = el.selectionEnd ?? 0;
    const pilih = value.slice(a, b);
    const n = tanda.length;

    // "*" tunggal jangan salah kenal sebagai bagian dari "**"
    const terbungkus =
      value.slice(a - n, a) === tanda &&
      value.slice(b, b + n) === tanda &&
      !(tanda === '*' && (value[a - 2] === '*' || value[b + 1] === '*'));

    let baru: string, ka: number, kb: number;
    if (terbungkus) {
      baru = value.slice(0, a - n) + pilih + value.slice(b + n);
      ka = a - n;
      kb = b - n;
    } else {
      baru = value.slice(0, a) + tanda + pilih + tanda + value.slice(b);
      ka = a + n;
      kb = b + n;
    }
    onChange(baru);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ka, kb);
    });
  };

  const hapusFormat = () => {
    const el = ref.current;
    if (!el) return;
    const a = el.selectionStart ?? 0;
    const b = el.selectionEnd ?? 0;
    const bersih = (s: string) => s.replace(/\*\*|__|\//g, '');
    onChange(a === b ? bersih(value) : value.slice(0, a) + bersih(value.slice(a, b)) + value.slice(b));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); bungkus('**'); }
    if (k === 'i') { e.preventDefault(); bungkus('*'); }
    if (k === 'u' && garisBawah) { e.preventDefault(); bungkus('__'); }
  };

  // onMouseDown + preventDefault supaya seleksi teks tidak hilang saat klik tombol
  const tombol = (label: React.ReactNode, title: string, aksi: () => void) => (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={aksi}
    >
      {label}
    </button>
  );

  const umum = {
    id,
    ref,
    className: 'form-control',
    value,
    placeholder,
    onKeyDown,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => onChange(e.target.value),
  };

  return (
    <div className="editor-rich">
      <div className="toolbar">
        {tombol(<b>B</b>, 'Tebal (Ctrl+B)', () => bungkus('**'))}
        {tombol(<i>I</i>, 'Miring (Ctrl+I)', () => bungkus('/'))}
        {garisBawah && tombol(<u>U</u>, 'Garis bawah (Ctrl+U)', () => bungkus('__'))}
        {tombol(<i className="fa-solid fa-eraser"></i>, 'Hapus format', hapusFormat)}
      </div>
      {rows ? <textarea {...umum} rows={rows} /> : <input type="text" {...umum} />}
    </div>
  );
}