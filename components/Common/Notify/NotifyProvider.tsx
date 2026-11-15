'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import styles from './Notify.module.css';

export type ToastTipe = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  tipe: ToastTipe;
  pesan: string;
  judul?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface PromptOptions {
  title?: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  inputType?: 'text' | 'password';
  minLength?: number;
  defaultValue?: string;
}

interface NotifyApi {
  success: (pesan: string, judul?: string) => void;
  error: (pesan: string, judul?: string) => void;
  warning: (pesan: string, judul?: string) => void;
  info: (pesan: string, judul?: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
  validateForm: (form: Element) => boolean;
}

type Kontrol = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function namaKolom(el: Kontrol): string {
  const dariLabel = el.labels?.[0]?.textContent;
  let teks = dariLabel || el.getAttribute('aria-label') || '';
  let induk: HTMLElement | null = el.parentElement;
  for (let i = 0; !teks && induk && i < 3; i++, induk = induk.parentElement) {
    teks = induk.querySelector('label')?.textContent || '';
  }
  teks = (teks || (el as HTMLInputElement).placeholder || el.name || '').replace(/\s+/g, ' ').trim();
  return teks || 'Kolom ini';
}

function alasanInvalid(el: Kontrol): string {
  const v = el.validity;
  const f = el as HTMLInputElement;
  if (v.valueMissing) return el instanceof HTMLSelectElement ? 'harus dipilih' : 'wajib diisi';
  if (v.typeMismatch) {
    if (f.type === 'email') return 'harus berupa email yang valid';
    if (f.type === 'url') return 'harus berupa URL yang valid';
    return 'formatnya tidak valid';
  }
  if (v.tooShort) return `minimal ${f.minLength} karakter`;
  if (v.tooLong) return `maksimal ${f.maxLength} karakter`;
  if (v.rangeUnderflow) return `tidak boleh kurang dari ${f.min}`;
  if (v.rangeOverflow) return `tidak boleh lebih dari ${f.max}`;
  if (v.patternMismatch) return 'formatnya tidak sesuai';
  if (v.badInput) return 'berisi nilai yang tidak valid';
  return 'nilainya tidak valid';
}

type DialogState =
  | { jenis: 'confirm'; opts: ConfirmOptions; selesai: (v: boolean) => void }
  | { jenis: 'prompt'; opts: PromptOptions; selesai: (v: string | null) => void };

const IKON: Record<ToastTipe, string> = {
  success: 'fa-solid fa-circle-check',
  error: 'fa-solid fa-circle-xmark',
  warning: 'fa-solid fa-triangle-exclamation',
  info: 'fa-solid fa-circle-info',
};

const JUDUL: Record<ToastTipe, string> = {
  success: 'Berhasil',
  error: 'Gagal',
  warning: 'Perhatian',
  info: 'Info',
};

// error dibiarkan lebih lama supaya sempat dibaca
const DURASI: Record<ToastTipe, number> = {
  success: 4500,
  info: 5000,
  warning: 6000,
  error: 7000,
};

const MAKS_TOAST = 4;

const NotifyContext = createContext<NotifyApi | null>(null);

export function useNotify(): NotifyApi {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify harus dipakai di dalam <NotifyProvider>.');
  return ctx;
}

export function NotifyProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const tutupToast = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const tampilToast = useCallback(
    (tipe: ToastTipe, pesan: string, judul?: string) => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, tipe, pesan, judul }].slice(-MAKS_TOAST));
      timers.current.set(
        id,
        setTimeout(() => tutupToast(id), DURASI[tipe])
      );
    },
    [tutupToast]
  );

  useEffect(() => {
    const aktif = timers.current;
    return () => aktif.forEach((t) => clearTimeout(t));
  }, []);

  const api = useMemo<NotifyApi>(
    () => ({
      success: (p, j) => tampilToast('success', p, j),
      error: (p, j) => tampilToast('error', p, j),
      warning: (p, j) => tampilToast('warning', p, j),
      info: (p, j) => tampilToast('info', p, j),
      confirm: (opts) =>
        new Promise<boolean>((resolve) => {
          setDialog({ jenis: 'confirm', opts, selesai: resolve });
        }),
      prompt: (opts) =>
        new Promise<string | null>((resolve) => {
          setDialog({ jenis: 'prompt', opts, selesai: resolve });
        }),
      validateForm: (form) => {
        const el = Array.from((form as HTMLFormElement).elements).find(
          (x): x is Kontrol =>
            (x instanceof HTMLInputElement || x instanceof HTMLSelectElement || x instanceof HTMLTextAreaElement) &&
            x.willValidate &&
            !x.checkValidity()
        );
        if (!el) return true;
        tampilToast('warning', `${namaKolom(el)} ${alasanInvalid(el)}.`, 'Form belum lengkap');
        el.focus();
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return false;
      },
    }),
    [tampilToast]
  );

  return (
    <NotifyContext.Provider value={api}>
      {children}

      <div className={styles.toastWrap} aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tipe]}`} role={t.tipe === 'error' ? 'alert' : 'status'}>
            <i className={`${IKON[t.tipe]} ${styles.toastIkon}`} aria-hidden="true" />
            <div className={styles.toastIsi}>
              <strong>{t.judul || JUDUL[t.tipe]}</strong>
              <span>{t.pesan}</span>
            </div>
            <button type="button" className={styles.toastTutup} aria-label="Tutup" onClick={() => tutupToast(t.id)}>
              ×
            </button>
            <span className={styles.toastBar} style={{ animationDuration: `${DURASI[t.tipe]}ms` }} />
          </div>
        ))}
      </div>

      {dialog && <Dialog state={dialog} onClose={() => setDialog(null)} />}
    </NotifyContext.Provider>
  );
}

function Dialog({ state, onClose }: { state: DialogState; onClose: () => void }) {
  const isPrompt = state.jenis === 'prompt';
  const opts = state.opts;
  const danger = state.jenis === 'confirm' && !!state.opts.danger;

  const [nilai, setNilai] = useState(state.jenis === 'prompt' ? state.opts.defaultValue || '' : '');
  const [lihat, setLihat] = useState(false);
  const [galat, setGalat] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const btnOkRef = useRef<HTMLButtonElement>(null);

  const batal = useCallback(() => {
    if (state.jenis === 'confirm') state.selesai(false);
    else state.selesai(null);
    onClose();
  }, [state, onClose]);

  useEffect(() => {
    (isPrompt ? inputRef.current : btnOkRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') batal();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isPrompt, batal]);

  const ok = (e?: FormEvent) => {
    e?.preventDefault();
    if (state.jenis === 'confirm') {
      state.selesai(true);
      onClose();
      return;
    }
    const v = nilai.trim() === '' ? '' : nilai;
    if (v === '') {
      setGalat('Kolom ini tidak boleh kosong.');
      return;
    }
    const min = state.opts.minLength;
    if (min && v.length < min) {
      setGalat(`Minimal ${min} karakter.`);
      return;
    }
    state.selesai(v);
    onClose();
  };

  const judul = opts.title || (isPrompt ? 'Masukkan Data' : danger ? 'Yakin?' : 'Konfirmasi');
  const teksOk = opts.confirmText || (isPrompt ? 'Simpan' : danger ? 'Ya, Lanjutkan' : 'Ya');
  const pakaiPassword = state.jenis === 'prompt' && state.opts.inputType === 'password';
  const tipeInput = pakaiPassword && !lihat ? 'password' : 'text';

  return (
    <div className={styles.backdrop} onMouseDown={batal}>
      <form
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-judul"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={ok}
      >
        <div className={`${styles.dialogIkon} ${danger ? styles.dialogIkonDanger : ''}`}>
          <i
            className={
              isPrompt ? 'fa-solid fa-key' : danger ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-question'
            }
            aria-hidden="true"
          />
        </div>
        <h4 id="notify-judul" className={styles.dialogJudul}>
          {judul}
        </h4>
        {opts.message && <p className={styles.dialogPesan}>{opts.message}</p>}

        {state.jenis === 'prompt' && (
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              className={`${styles.input} ${galat ? styles.inputGalat : ''}`}
              type={tipeInput}
              value={nilai}
              placeholder={state.opts.placeholder}
              autoComplete="off"
              onChange={(e) => {
                setNilai(e.target.value);
                setGalat('');
              }}
            />
            {pakaiPassword && (
              <button
                type="button"
                className={styles.mata}
                aria-label={lihat ? 'Sembunyikan' : 'Tampilkan'}
                onClick={() => setLihat((v) => !v)}
              >
                <i className={lihat ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} aria-hidden="true" />
              </button>
            )}
            {galat && <small className={styles.galat}>{galat}</small>}
          </div>
        )}

        <div className={styles.dialogAksi}>
          <button type="button" className={styles.btnBatal} onClick={batal}>
            {opts.cancelText || 'Batal'}
          </button>
          <button ref={btnOkRef} type="submit" className={`${styles.btnOk} ${danger ? styles.btnDanger : ''}`}>
            {teksOk}
          </button>
        </div>
      </form>
    </div>
  );
}
