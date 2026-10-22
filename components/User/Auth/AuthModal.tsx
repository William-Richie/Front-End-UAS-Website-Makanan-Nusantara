'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Modal, Form, InputGroup, Button, Row, Col } from 'react-bootstrap';
import styles from './AuthModal.module.css';
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

function EyeButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <Button
      variant="outline-secondary"
      className={styles.togglePass}
      onClick={onClick}
      aria-label={shown ? 'Sembunyikan password' : 'Tampilkan password'}
    >
      <i className={`fa-solid ${shown ? 'fa-eye-slash' : 'fa-eye'}`}></i>
    </Button>
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
    const t = requestAnimationFrame(() => wrap.classList.add(styles.ready));
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

  const msg = (err: string, key: string, pane: Tab) => (tampil(key, pane) ? err : '');

  const isLogin = tab === 'login';
  const showChecklist = pwFocus || reg.password.length > 0;

  if (!show) return null;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      backdrop="static"
      dialogClassName={styles.authDialog}
      contentClassName={`${styles.authCard} border-0 overflow-hidden`}
    >
      <Row className="g-0">
        <Col md={5} className={`${styles.authSide} d-none d-md-flex flex-column align-items-center justify-content-center text-center p-4`}>
          <span className={`${styles.authFloat} ${styles.a1}`}><i className="fa-solid fa-pepper-hot"></i></span>
          <span className={`${styles.authFloat} ${styles.a2}`}><i className="fa-solid fa-fish"></i></span>
          <span className={`${styles.authFloat} ${styles.a3}`}><i className="fa-solid fa-lemon"></i></span>
          <span className={`${styles.authFloat} ${styles.a4}`}><i className="fa-solid fa-leaf"></i></span>
          <Image
            src="/img/Web-Icon/Papeda-icon.png"
            alt="Papeda"
            width={130}
            height={130}
            className={styles.authLogo}
          />
          <h4 className="mt-3 mb-1 text-white">Papeda Restaurant</h4>
          <p className="small mb-0 text-white-50">Cita Rasa Timur Indonesia</p>
        </Col>

        <Col md={7} className="p-4 p-md-5 position-relative">
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
            <div key={tab} className={styles.authHeadSwap}>
              <h4 id="auth-title" className="fw-bold mb-1">
                {isLogin ? 'Selamat Datang' : 'Buat Akun Baru'}
              </h4>
              <p id="auth-desc" className="text-muted small mb-0">
                {isLogin ? 'Masuk untuk reservasi & pesanan Anda' : 'Isi data di bawah untuk mendaftar'}
              </p>
            </div>
          </div>

          <div className={`${styles.authTabs} mb-3 ${isLogin ? '' : styles.isRegister}`} role="tablist">
            <span className={styles.authTabPill} aria-hidden="true"></span>
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              className={`${styles.authTab} ${isLogin ? styles.active : ''}`}
              onClick={() => gantiTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              className={`${styles.authTab} ${!isLogin ? styles.active : ''}`}
              onClick={() => gantiTab('register')}
            >
              Register
            </button>
          </div>

          <div className={styles.authPanes} ref={panesRef}>
            {/* LOGIN */}
            <div
              ref={loginPaneRef}
              className={`${styles.authSlide} ${styles.fromLeft} ${isLogin ? styles.on : ''}`}
              aria-hidden={!isLogin}
              inert={!isLogin}
            >
              <Form onSubmit={handleLogin} noValidate autoComplete="off" className={styles.authForm}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.authLabel}>Email</Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text><i className="fa-solid fa-envelope"></i></InputGroup.Text>
                    <Form.Control
                      id="login-email"
                      type="email"
                      placeholder="nama@email.com"
                      value={login.email}
                      onChange={(e) => setLogin({ ...login, email: e.target.value })}
                      onBlur={() => sentuh('l.email')}
                      isInvalid={!!msg(loginErr.email, 'l.email', 'login')}
                    />
                    <Form.Control.Feedback type="invalid">
                      <i className="fa-solid fa-circle-exclamation"></i> {msg(loginErr.email, 'l.email', 'login')}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className={styles.authLabel}>Password</Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text><i className="fa-solid fa-lock"></i></InputGroup.Text>
                    <Form.Control
                      id="login-password"
                      type={showPass.login ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      value={login.password}
                      onChange={(e) => setLogin({ ...login, password: e.target.value })}
                      onBlur={() => sentuh('l.password')}
                      isInvalid={!!msg(loginErr.password, 'l.password', 'login')}
                    />
                    <EyeButton shown={showPass.login} onClick={() => setShowPass((s) => ({ ...s, login: !s.login }))} />
                    <Form.Control.Feedback type="invalid">
                      <i className="fa-solid fa-circle-exclamation"></i> {msg(loginErr.password, 'l.password', 'login')}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                {isLogin && serverError && (
                  <div key={shakeKey} className={`form-alert ${styles.shake}`} role="alert">
                    {serverError}
                  </div>
                )}

                <Button type="submit" disabled={loading} variant="papeda" className="w-100">
                  {loading ? 'Memproses...' : 'Login'} <i className="fa-solid fa-arrow-right ms-1"></i>
                </Button>
                <p className="text-center small text-muted mt-3 mb-0">
                  Belum punya akun?{' '}
                  <button type="button" className={styles.authLink} onClick={() => gantiTab('register')}>
                    Daftar di sini
                  </button>
                </p>
              </Form>
            </div>

            {/* REGISTER */}
            <div
              ref={regPaneRef}
              className={`${styles.authSlide} ${styles.fromRight} ${!isLogin ? styles.on : ''}`}
              aria-hidden={isLogin}
              inert={isLogin}
            >
              <Form onSubmit={handleRegister} noValidate autoComplete="off" className={styles.authForm}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.authLabel}>Nama Lengkap</Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text><i className="fa-solid fa-user"></i></InputGroup.Text>
                    <Form.Control
                      id="reg-nama"
                      type="text"
                      maxLength={32}
                      placeholder="Contoh: Budi Santoso"
                      value={reg.nama}
                      onChange={(e) => setReg({ ...reg, nama: e.target.value })}
                      onBlur={() => sentuh('r.nama')}
                      isInvalid={!!msg(regErr.nama, 'r.nama', 'register')}
                    />
                    <Form.Control.Feedback type="invalid">
                      <i className="fa-solid fa-circle-exclamation"></i> {msg(regErr.nama, 'r.nama', 'register')}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className={styles.authLabel}>Email</Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text><i className="fa-solid fa-envelope"></i></InputGroup.Text>
                    <Form.Control
                      id="reg-email"
                      type="email"
                      maxLength={64}
                      placeholder="nama@email.com"
                      value={reg.email}
                      onChange={(e) => setReg({ ...reg, email: e.target.value })}
                      onBlur={() => sentuh('r.email')}
                      isInvalid={!!msg(regErr.email, 'r.email', 'register')}
                    />
                    <Form.Control.Feedback type="invalid">
                      <i className="fa-solid fa-circle-exclamation"></i> {msg(regErr.email, 'r.email', 'register')}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className={styles.authLabel}>Password</Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text><i className="fa-solid fa-lock"></i></InputGroup.Text>
                    <Form.Control
                      id="reg-password"
                      type={showPass.reg ? 'text' : 'password'}
                      placeholder="Buat password"
                      value={reg.password}
                      onChange={(e) => setReg({ ...reg, password: e.target.value })}
                      onFocus={() => setPwFocus(true)}
                      onBlur={() => {
                        setPwFocus(false);
                        sentuh('r.password');
                      }}
                      isInvalid={!!msg(regErr.password, 'r.password', 'register')}
                    />
                    <EyeButton shown={showPass.reg} onClick={() => setShowPass((s) => ({ ...s, reg: !s.reg }))} />
                    <Form.Control.Feedback type="invalid">
                      <i className="fa-solid fa-circle-exclamation"></i> {msg(regErr.password, 'r.password', 'register')}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                {showChecklist && (
                  <ul className={`${styles.pwRules} mb-3`} aria-label="Syarat password">
                    {PASSWORD_RULES.map((r) => {
                      const ok = r.test(reg.password);
                      const salah = !ok && (reg.password.length > 0 || tampil('r.password', 'register'));
                      return (
                        <li key={r.id} className={ok ? styles.ok : salah ? styles.bad : ''}>
                          <i className={`fa-solid ${ok ? 'fa-circle-check' : salah ? 'fa-circle-xmark' : 'fa-circle'}`}></i>
                          {r.label}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <Form.Group className="mb-3">
                  <Form.Label className={styles.authLabel}>Konfirmasi Password</Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text><i className="fa-solid fa-shield-halved"></i></InputGroup.Text>
                    <Form.Control
                      id="reg-confirm"
                      type={showPass.confirm ? 'text' : 'password'}
                      placeholder="Ketik ulang password"
                      value={reg.confirm}
                      onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
                      onBlur={() => sentuh('r.confirm')}
                      isInvalid={!!msg(regErr.confirm, 'r.confirm', 'register')}
                    />
                    <EyeButton shown={showPass.confirm} onClick={() => setShowPass((s) => ({ ...s, confirm: !s.confirm }))} />
                    <Form.Control.Feedback type="invalid">
                      <i className="fa-solid fa-circle-exclamation"></i> {msg(regErr.confirm, 'r.confirm', 'register')}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                {!isLogin && serverError && (
                  <div key={shakeKey} className={`form-alert ${styles.shake}`} role="alert">
                    {serverError}
                  </div>
                )}

                <Button type="submit" disabled={loading} variant="papeda" className="w-100">
                  {loading ? 'Mendaftar...' : 'Buat Akun'} <i className="fa-solid fa-utensils ms-1"></i>
                </Button>
                <p className="text-center small text-muted mt-3 mb-0">
                  Sudah punya akun?{' '}
                  <button type="button" className={styles.authLink} onClick={() => gantiTab('login')}>
                    Login
                  </button>
                </p>
              </Form>
            </div>
          </div>
        </Col>
      </Row>
    </Modal>
  );
}