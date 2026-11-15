import { Fragment, type ReactNode } from 'react';

// **tebal**  *miring*  __garis bawah__
const POLA = /\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\/([\s\S]+?)\//;

export function parseRich(teks: string, prefix = 'r'): ReactNode[] {
  const hasil: ReactNode[] = [];
  let sisa = teks;
  let i = 0;

  while (sisa) {
    const m = POLA.exec(sisa);
    if (!m) {
      hasil.push(sisa);
      break;
    }
    if (m.index > 0) hasil.push(sisa.slice(0, m.index));

    const key = `${prefix}-${i++}`;
    if (m[1] !== undefined) hasil.push(<strong key={key} className="rt-b">{parseRich(m[1], key)}</strong>);
    else if (m[2] !== undefined) hasil.push(<u key={key} className="rt-u">{parseRich(m[2], key)}</u>);
    else if (m[3] !== undefined) hasil.push(<em key={key} className="rt-i">{parseRich(m[3], key)}</em>);

    sisa = sisa.slice(m.index + m[0].length);
  }
  return hasil;
}

export default function RichText({ teks, className }: { teks?: string | null; className?: string }) {
  if (!teks) return null;
  return (
    <span className={className} style={{ whiteSpace: 'pre-line' }}>
      <Fragment>{parseRich(teks)}</Fragment>
    </span>
  );
}

// Untuk email jawaban FAQ (dipakai di backend/API yang kirim mail)
export function richKeHtml(teks: string): string {
  const aman = teks
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return aman
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__([\s\S]+?)__/g, '<u>$1</u>')
    .replace(/\/([\s\S]+?)\//g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

export function stripRich(teks: string): string {
  return teks.replace(/\*\*|__|\//g, '');
}