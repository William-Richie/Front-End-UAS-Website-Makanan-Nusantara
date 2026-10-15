'use client';

import { useState, useEffect } from 'react';
import { validateNama } from '@/lib/validation';

interface ProfileUser {
  id: string;
  nama: string;
  email: string;
}

interface ProfileModalProps {
  show: boolean;
  user: ProfileUser | null;
  onClose: () => void;
  onSaved: (user: ProfileUser) => void;
  onLogout: () => void;
}

export default function ProfileModal({ show, user, onClose, onSaved, onLogout }: ProfileModalProps) {
  const [nama, setNama] = useState(user?.nama ?? '');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

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

  if (!show || !user) return null;

  const error = validateNama(nama);
  const berubah = nama.trim() !== user.nama;

  const simpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    if (!berubah) {
      onClose();
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, email: user.email, nama: nama.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(
          res.status >= 500 ? 'Server lagi bermasalah, coba lagi sebentar lagi.' : data.error || 'Gagal menyimpan.'
        );
        return;
      }
      localStorage.setItem('papeda_user', JSON.stringify(data.user));
      onSaved(data.user);
      onClose();
    } catch {
      setServerError('Tidak bisa terhubung ke server. Cek koneksi kamu lalu coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="profileModal"
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Profile"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content auth-card border-0 position-relative">
          <button
            type="button"
            className="btn-close position-absolute top-0 end-0 m-3"
            onClick={onClose}
            aria-label="Close"
          />
          <form id="form-profile" className="p-4" onSubmit={simpan} noValidate>
            <div className="text-center mb-3">
              <div className="gate-icon">
                <i className="fa-solid fa-user"></i>
              </div>
              <h5 className="fw-bold mb-0">Profile</h5>
            </div>

            <div className="mb-3">
              <label htmlFor="profile-nama" className="auth-label">Nama Pengguna</label>
              <input
                id="profile-nama"
                type="text"
                autoFocus
                autoComplete="off"
                maxLength={32}
                className={`form-control ${touched && error ? 'is-invalid' : ''}`}
                placeholder="Contoh: Budi Santoso"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                onBlur={() => setTouched(true)}
              />
              {touched && error && (
                <div className="auth-field-error" role="alert">
                  <i className="fa-solid fa-circle-exclamation"></i> {error}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="profile-email" className="auth-label">Email</label>
              <input id="profile-email" type="email" className="form-control" value={user.email} disabled />
              <div className="form-text small">Email tidak bisa diubah.</div>
            </div>

            {serverError && (
              <div className="auth-error" role="alert">
                {serverError}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-papeda w-100">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger w-100 mt-2"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <i className="fa-solid fa-right-from-bracket me-2"></i>Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}