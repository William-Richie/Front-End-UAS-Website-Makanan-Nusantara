'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { validateNama } from '@/lib/validation';
import styles from './ProfileModal.module.css';

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
    <Modal 
      show={show} 
      onHide={onClose} 
      centered 
      size="sm" 
      backdrop="static" 
      contentClassName={`${styles.profileCard} border-0 position-relative`}
    >
      <button
        type="button"
        className="btn-close position-absolute top-0 end-0 m-3"
        onClick={onClose}
        aria-label="Close"
      />
      
      <Form id="form-profile" className={`${styles.profileForm} p-4`} onSubmit={simpan} noValidate>
        <div className="text-center mb-3">
          <div className="gate-icon">
            <i className="fa-solid fa-user"></i>
          </div>
          <h5 className="fw-bold mb-0">Profile</h5>
        </div>

        <Form.Group className="mb-3">
          <Form.Label className={styles.label}>Nama Pengguna</Form.Label>
          <Form.Control
            id="profile-nama"
            type="text"
            autoFocus
            autoComplete="off"
            maxLength={32}
            placeholder="Contoh: Budi Santoso"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            onBlur={() => setTouched(true)}
            isInvalid={touched && !!error}
          />
          {touched && error && (
            <Form.Control.Feedback type="invalid">
              <i className="fa-solid fa-circle-exclamation"></i> {error}
            </Form.Control.Feedback>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className={styles.label}>Email</Form.Label>
          <Form.Control id="profile-email" type="email" value={user.email} disabled />
          <Form.Text className="small">Email tidak bisa diubah.</Form.Text>
        </Form.Group>

        {serverError && (
          <div className="form-alert" role="alert">
            {serverError}
          </div>
        )}

        <Button type="submit" disabled={loading} variant="papeda" className="w-100">
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button
          variant="outline-danger"
          className="w-100 mt-2"
          onClick={() => {
            onClose();
            onLogout();
          }}
        >
          <i className="fa-solid fa-right-from-bracket me-2"></i>Logout
        </Button>
      </Form>
    </Modal>
  );
}