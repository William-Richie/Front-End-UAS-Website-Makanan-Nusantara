'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Image from 'next/image';
import {
  PASSWORD_RULES,
  isPasswordStrong,
  validateEmail,
  validateNama,
} from '@/lib/validation';

type Tab = 'login' | 'register';
type AuthUser = { id: string; nama: string; email: string };

interface AuthModalProps {
  show: boolean;
  initialTab?: Tab;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

interface FieldProps {
  id: string;
  label: string;
  icon: string;
  error?: string;
  children: React.ReactNode;
  addon?: React.ReactNode;
}

function Field({ id, label, icon, error, children, addon }: FieldProps) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="input-group has-validation">
        <span className="input-group-text">
          <i className={`fa-solid ${icon}`}></i>
        </span>
        {children}
        {addon}
      </div>
      {error && (
        <div className="auth-field-error" id={`${id}-err`} role="alert">
          <i className="fa-solid fa-circle-exclamation"></i> {error}
        </div>
      )}
    </div>
  );
}

function EyeButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="input-group-text toggle-pass"
      onClick={onClick}
      aria-label={shown ? 'Sembunyikan password' : 'Tampilkan password'}
    >
      <i className={`fa-solid ${shown ? 'fa-eye-slash' : 'fa-eye'}`}></i>
    </button>
  );
}

function pesanError(status: number, serverMsg?: string, fallback = 'Terjadi kesalahan, coba lagi.') {
  if (status >= 500) return 'Server lagi bermasalah, coba lagi sebentar lagi.';
  return serverMsg || fallback;
}

export default function AuthModal({
  show,
  initialTab = 'login',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const [login, setLogin] = useState({ email: '', password: '' });
  const [reg, setReg] = useState({ nama: '', email: '', password: '', confirm: '' });

  const [showPass, setShowPass] = useState({ login: false, reg: false, confirm: false });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState({ login: false, register: false });
  const [serverError, setServerError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  const panesRef = useRef<HTMLDivElement>(null);
  const loginPaneRef = useRef<HTMLDivElement>(null);
  const regPaneRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!show) return;
    const wrap = panesRef.current;
    const pane = tab === 'login' ? loginPaneRef.current : regPaneRef.current;
    if (!wrap || !pane) return;

    const sesuaikan = () => {
      wrap.style.height = `${pane.offsetHeight}px`;
    };
    sesuaikan();
    const t = requestAnimationFrame(() => wrap.classList.add('ready'));
    const ro = new ResizeObserver(sesuaikan);
    ro.observe(pane);
    return () => {
      cancelAnimationFrame(t);
      ro.disconnect();
    };
  }, [tab, show]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [show, onClose]);

  useEffect(() => {
    if (!show) return;
    const pane = tab === 'login' ? loginPaneRef.current : regPaneRef.current;
    const t = setTimeout(() => pane?.querySelector<HTMLInputElement>('input')?.focus(), 250);
    return () => clearTimeout(t);
  }, [tab, show]);

  if (!show) return null;

  const gantiTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setServerError('');
    setPwFocus(false);
  };

  const sentuh = (key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));
  const tampil = (key: string, pane: Tab) => touched[key] || tried[pane];

  const loginErr = {
    email: validateEmail(login.email),
    password: login.password ? '' : 'Password wajib diisi.',
  };
  const regErr = {
    nama: validateNama(reg.nama),
    email: validateEmail(reg.email),
    password: !reg.password
      ? 'Password wajib diisi.'
      : isPasswordStrong(reg.password)
        ? ''
        : 'Password belum memenuhi semua syarat di bawah.',
    confirm: !reg.confirm
      ? 'Ketik ulang password kamu.'
      : reg.confirm !== reg.password
        ? 'Password konfirmasi belum sama.'
        : '',
  };

  const gagal = (msg: string) => {
    setServerError(msg);
    setShakeKey((k) => k + 1);
  };

  const kirim = async (url: string, body: object, fallback: string) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        gagal(pesanError(res.status, data.error, fallback));
        return;
      }
      localStorage.setItem('papeda_user', JSON.stringify(data.user));
      onSuccess(data.user);
      onClose();
    } catch {
      gagal('Tidak bisa terhubung ke server. Cek koneksi kamu lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTried((t) => ({ ...t, login: true }));
    if (loginErr.email || loginErr.password) {
      setShakeKey((k) => k + 1);
      document.getElementById(loginErr.email ? 'login-email' : 'login-password')?.focus();
      return;
    }
    kirim('/api/auth/login', { email: login.email.trim(), password: login.password }, 'Login gagal.');
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTried((t) => ({ ...t, register: true }));
    if (Object.values(regErr).some(Boolean)) {
      setShakeKey((k) => k + 1);
      const pertama = (['nama', 'email', 'password', 'confirm'] as const).find((k) => regErr[k]);
      document.getElementById(`reg-${pertama}`)?.focus();
      return;
    }
    kirim(
      '/api/auth/register',
      { nama: reg.nama.trim(), email: reg.email.trim(), password: reg.password },
      'Pendaftaran gagal.'
    );
  };

  const cls = (err: string, key: string, pane: Tab) =>
    `form-control ${err && tampil(key, pane) ? 'is-invalid' : ''}`;
  const msg = (err: string, key: string, pane: Tab) => (tampil(key, pane) ? err : '');

  const isLogin = tab === 'login';
  const showChecklist = pwFocus || reg.password.length > 0;

  return (
    <div
      id="authModal"
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={isLogin ? 'Login' : 'Register'}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content auth-card border-0 overflow-hidden position-relative">
          <div className="row g-0">
            <div className="col-md-5 auth-side d-none d-md-flex flex-column align-items-center justify-content-center text-center p-4">
              <span className="auth-float a1"><i className="fa-solid fa-pepper-hot"></i></span>
              <span className="auth-float a2"><i className="fa-solid fa-fish"></i></span>
              <span className="auth-float a3"><i className="fa-solid fa-lemon"></i></span>
              <span className="auth-float a4"><i className="fa-solid fa-leaf"></i></span>
              <Image
                src="/img/Web-Icon/Papeda-icon.png"
                alt="Papeda"
                width={70}
                height={70}
                className="auth-logo"
              />
              <h4 className="mt-3 mb-1 text-white">Papeda Restaurant</h4>
              <p className="small mb-0 text-white-50">Cita Rasa Timur Indonesia</p>
            </div>

            <div className="col-md-7 p-4 p-md-5 position-relative">
              <button
                type="button"
                className="btn-close position-absolute top-0 end-0 m-3"
                onClick={onClose}
                aria-label="Close"
              />

              <div className="text-center mb-3">
                <div className="gate-icon">
                  <i className={`fa-solid ${isLogin ? 'fa-lock' : 'fa-user-plus'}`}></i>
                </div>
                <div key={tab} className="auth-head-swap">
                  <h4 id="auth-title" className="fw-bold mb-1">
                    {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
                  </h4>
                  <p id="auth-desc" className="text-muted small mb-0">
                    {isLogin ? 'Masuk untuk reservasi & pesanan Anda' : 'Isi data di bawah untuk mendaftar'}
                  </p>
                </div>
              </div>

              <div className={`auth-tabs mb-3 ${isLogin ? '' : 'is-register'}`} role="tablist">
                <span className="auth-tab-pill" aria-hidden="true"></span>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  className={`auth-tab flex-fill btn ${isLogin ? 'active' : ''}`}
                  onClick={() => gantiTab('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  className={`auth-tab flex-fill btn ${!isLogin ? 'active' : ''}`}
                  onClick={() => gantiTab('register')}
                >
                  Register
                </button>
              </div>

              <div className="auth-panes" ref={panesRef}>
                {/* LOGIN */}
                <div
                  ref={loginPaneRef}
                  className={`auth-slide from-left ${isLogin ? 'on' : ''}`}
                  aria-hidden={!isLogin}
                  inert={!isLogin}
                >
                  <form onSubmit={handleLogin} noValidate autoComplete="off">
                    <Field
                      id="login-email"
                      label="Email"
                      icon="fa-envelope"
                      error={msg(loginErr.email, 'l.email', 'login')}
                    >
                      <input
                        id="login-email"
                        name="login-email"
                        type="email"
                        autoComplete="off"
                        className={cls(loginErr.email, 'l.email', 'login')}
                        placeholder="nama@email.com"
                        value={login.email}
                        onChange={(e) => setLogin({ ...login, email: e.target.value })}
                        onBlur={() => sentuh('l.email')}
                      />
                    </Field>

                    <Field
                      id="login-password"
                      label="Password"
                      icon="fa-lock"
                      error={msg(loginErr.password, 'l.password', 'login')}
                      addon={
                        <EyeButton
                          shown={showPass.login}
                          onClick={() => setShowPass((s) => ({ ...s, login: !s.login }))}
                        />
                      }
                    >
                      <input
                        id="login-password"
                        name="login-password"
                        type={showPass.login ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={cls(loginErr.password, 'l.password', 'login')}
                        placeholder="Masukkan password"
                        value={login.password}
                        onChange={(e) => setLogin({ ...login, password: e.target.value })}
                        onBlur={() => sentuh('l.password')}
                      />
                    </Field>

                    {isLogin && serverError && (
                      <div key={shakeKey} className="auth-error shake" role="alert">
                        {serverError}
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="btn btn-papeda w-100">
                      {loading ? 'Memproses...' : 'Login'} <i className="fa-solid fa-arrow-right ms-1"></i>
                    </button>
                    <p className="text-center small text-muted mt-3 mb-0">
                      Belum punya akun?{' '}
                      <button type="button" className="auth-link" onClick={() => gantiTab('register')}>
                        Daftar di sini
                      </button>
                    </p>
                  </form>
                </div>

                {/* REGISTER */}
                <div
                  ref={regPaneRef}
                  className={`auth-slide from-right ${!isLogin ? 'on' : ''}`}
                  aria-hidden={isLogin}
                  inert={isLogin}
                >
                  <form onSubmit={handleRegister} noValidate autoComplete="off">
                    <Field
                      id="reg-nama"
                      label="Nama Lengkap"
                      icon="fa-user"
                      error={msg(regErr.nama, 'r.nama', 'register')}
                    >
                      <input
                        id="reg-nama"
                        name="reg-nama"
                        type="text"
                        autoComplete="off"
                        maxLength={32}
                        className={cls(regErr.nama, 'r.nama', 'register')}
                        placeholder="Contoh: Budi Santoso"
                        value={reg.nama}
                        onChange={(e) => setReg({ ...reg, nama: e.target.value })}
                        onBlur={() => sentuh('r.nama')}
                      />
                    </Field>

                    <Field
                      id="reg-email"
                      label="Email"
                      icon="fa-envelope"
                      error={msg(regErr.email, 'r.email', 'register')}
                    >
                      <input
                        id="reg-email"
                        name="reg-email"
                        type="email"
                        autoComplete="off"
                        maxLength={64}
                        className={cls(regErr.email, 'r.email', 'register')}
                        placeholder="nama@email.com"
                        value={reg.email}
                        onChange={(e) => setReg({ ...reg, email: e.target.value })}
                        onBlur={() => sentuh('r.email')}
                      />
                    </Field>

                    <Field
                      id="reg-password"
                      label="Password"
                      icon="fa-lock"
                      error={msg(regErr.password, 'r.password', 'register')}
                      addon={
                        <EyeButton
                          shown={showPass.reg}
                          onClick={() => setShowPass((s) => ({ ...s, reg: !s.reg }))}
                        />
                      }
                    >
                      <input
                        id="reg-password"
                        name="reg-password"
                        type={showPass.reg ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={cls(regErr.password, 'r.password', 'register')}
                        placeholder="Buat password"
                        value={reg.password}
                        onChange={(e) => setReg({ ...reg, password: e.target.value })}
                        onFocus={() => setPwFocus(true)}
                        onBlur={() => {
                          setPwFocus(false);
                          sentuh('r.password');
                        }}
                      />
                    </Field>

                    {showChecklist && (
                      <ul className="pw-rules" aria-label="Syarat password">
                        {PASSWORD_RULES.map((r) => {
                          const ok = r.test(reg.password);
                          const salah = !ok && (reg.password.length > 0 || tampil('r.password', 'register'));
                          return (
                            <li key={r.id} className={ok ? 'ok' : salah ? 'bad' : ''}>
                              <i className={`fa-solid ${ok ? 'fa-circle-check' : salah ? 'fa-circle-xmark' : 'fa-circle'}`}></i>
                              {r.label}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <Field
                      id="reg-confirm"
                      label="Konfirmasi Password"
                      icon="fa-shield-halved"
                      error={msg(regErr.confirm, 'r.confirm', 'register')}
                      addon={
                        <EyeButton
                          shown={showPass.confirm}
                          onClick={() => setShowPass((s) => ({ ...s, confirm: !s.confirm }))}
                        />
                      }
                    >
                      <input
                        id="reg-confirm"
                        name="reg-confirm"
                        type={showPass.confirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={cls(regErr.confirm, 'r.confirm', 'register')}
                        placeholder="Ketik ulang password"
                        value={reg.confirm}
                        onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
                        onBlur={() => sentuh('r.confirm')}
                      />
                    </Field>

                    {!isLogin && serverError && (
                      <div key={shakeKey} className="auth-error shake" role="alert">
                        {serverError}
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="btn btn-papeda w-100">
                      {loading ? 'Mendaftar...' : 'Buat Akun'} <i className="fa-solid fa-utensils ms-1"></i>
                    </button>
                    <p className="text-center small text-muted mt-3 mb-0">
                      Sudah punya akun?{' '}
                      <button type="button" className="auth-link" onClick={() => gantiTab('login')}>
                        Login
                      </button>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
