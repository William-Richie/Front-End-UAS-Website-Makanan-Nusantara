'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { validateNama } from '@/lib/validation';
import { useFocusReturn } from '@/hooks/useFocusReturn';
import styles from './ProfileModal.module.css';

interface ProfileUser {
  id: string;
  nama: string;
  email: string;
  username?: string;
}

interface ProfileModalProps {
  show: boolean;
  user: ProfileUser | null;
  onClose: () => void;
  onSaved: (user: ProfileUser) => void;
}

export default function ProfileModal({ show, user, onClose, onSaved }: ProfileModalProps) {
  const handleExited = useFocusReturn(show);
  const [nama, setNama] = useState(user?.nama ?? '');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [prevShow, setPrevShow] = useState(show);

  if (show !== prevShow) {
    setPrevShow(show);
    if (show) {
      setNama(user?.nama ?? '');
      setTouched(false);
      setServerError('');
    }
  }

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      document.getElementById('profile-nama')?.focus({ preventScroll: true });
    }, 250);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [show, onClose]);

  if (!user) return null;

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
      autoFocus={false}
      restoreFocus={false}
      onExited={handleExited}
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

        {user.username && (
          <Form.Group className="mb-3">
            <Form.Label className={styles.label}>Username</Form.Label>
            <Form.Control
              id="profile-username"
              type="text"
              value={`@${user.username}`}
              disabled
              readOnly
            />
            <Form.Text className="small">Username tidak bisa diubah.</Form.Text>
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Label className={styles.label}>Nama Lengkap</Form.Label>
          <Form.Control
            id="profile-nama"
            type="text"
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
      </Form>
    </Modal>
  );
}