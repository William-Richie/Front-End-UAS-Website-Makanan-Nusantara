'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AuthModalProps {
  show: boolean;
  initialTab?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: { id: string; nama: string; email: string }) => void;
}

export default function AuthModal({
  show,
  initialTab = 'login',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal.');

      localStorage.setItem('papeda_user', JSON.stringify(data.user));
      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal, periksa email dan password Anda.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setErrorMsg('Password konfirmasi tidak cocok.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: nama.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pendaftaran gagal.');

      localStorage.setItem('papeda_user', JSON.stringify(data.user));
      onSuccess(data.user);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pendaftaran gagal.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content auth-card border-0 overflow-hidden position-relative">
          <div className="row g-0">
            {/* Visual Side */}
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

            {/* Form Side */}
            <div className="col-md-7 p-4 p-md-5 position-relative">
              <button
                type="button"
                className="btn-close position-absolute top-0 end-0 m-3"
                onClick={onClose}
                aria-label="Close"
              />

              <div className="text-center mb-3">
                <div className="gate-icon"><i className="fa-solid fa-lock"></i></div>
                <h4 id="auth-title" className="fw-bold mb-1">
                  {tab === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
                </h4>
                <p id="auth-desc" className="text-muted small mb-0">
                  {tab === 'login' ? 'Masuk untuk reservasi & pesanan Anda' : 'Lengkapi data Anda di bawah ini'}
                </p>
              </div>

              <div className="auth-tabs mb-3 d-flex gap-2">
                <button
                  type="button"
                  className={`auth-tab flex-fill btn ${tab === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setTab('login');
                    setErrorMsg('');
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`auth-tab flex-fill btn ${tab === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setTab('register');
                    setErrorMsg('');
                  }}
                >
                  Register
                </button>
              </div>

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="auth-pane active">
                  <div className="input-group mb-3">
                    <span className="input-group-text"><i className="fa-solid fa-envelope"></i></span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group mb-3">
                    <span className="input-group-text"><i className="fa-solid fa-lock"></i></span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      className="input-group-text toggle-pass"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowPass((p) => !p)}
                    >
                      <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </span>
                  </div>

                  {errorMsg && <div className="alert alert-danger py-2 small">{errorMsg}</div>}

                  <button type="submit" disabled={loading} className="btn btn-papeda w-100">
                    {loading ? 'Memproses...' : 'Login'} <i className="fa-solid fa-arrow-right ms-1"></i>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="auth-pane active">
                  <div className="input-group mb-3">
                    <span className="input-group-text"><i className="fa-solid fa-user"></i></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nama lengkap"
                      maxLength={32}
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                  </div>
                  <div className="input-group mb-3">
                    <span className="input-group-text"><i className="fa-solid fa-envelope"></i></span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      maxLength={64}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group mb-3">
                    <span className="input-group-text"><i className="fa-solid fa-lock"></i></span>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Password (min. 6 karakter)"
                      minLength={6}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      className="input-group-text toggle-pass"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowPass((p) => !p)}
                    >
                      <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </span>
                  </div>
                  <div className="input-group mb-3">
                    <span className="input-group-text"><i className="fa-solid fa-shield-halved"></i></span>
                    <input
                      type={showPass2 ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Ulangi password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                    <span
                      className="input-group-text toggle-pass"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowPass2((p) => !p)}
                    >
                      <i className={`fa-solid ${showPass2 ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </span>
                  </div>

                  {errorMsg && <div className="alert alert-danger py-2 small">{errorMsg}</div>}

                  <button type="submit" disabled={loading} className="btn btn-papeda w-100">
                    {loading ? 'Mendaftar...' : 'Buat Akun'} <i className="fa-solid fa-utensils ms-1"></i>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
