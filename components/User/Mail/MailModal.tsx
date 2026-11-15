'use client';

import { Modal } from 'react-bootstrap';
import styles from './MailModal.module.css';

export interface MailItem {
  id: number;
  pertanyaan: string;
  jawaban: string | null;
  dijawab_at: string | null;
  dibaca_user: boolean;
}

interface MailModalProps {
  show: boolean;
  items: MailItem[];
  /** id pesan yang baru saat Mail dibuka (untuk label "Baru") */
  baruIds: number[];
  onClose: () => void;
}

const formatTanggal = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '';

export default function MailModal({ show, items, baruIds, onClose }: MailModalProps) {
  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      scrollable
      contentClassName={`${styles.mailModal} border-0`}
    >
      <Modal.Header closeButton className={styles.mailHead}>
        <Modal.Title as="h3" className={styles.mailTitle}>
          <i className="fa-solid fa-envelope me-2" />
          Mail
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={styles.mailBody}>
        {items.length === 0 ? (
          <div className={styles.mailEmpty}>
            <i className="fa-regular fa-envelope-open" />
            <p>Belum ada pesan. Jawaban dari kami untuk pertanyaan FAQ Anda akan muncul di sini.</p>
          </div>
        ) : (
          <ul className={styles.mailList}>
            {items.map((m) => (
              <li key={m.id} className={styles.mailItem}>
                <div className={styles.mailMeta}>
                  <span className={styles.mailFrom}>
                    <i className="fa-solid fa-leaf me-1" />
                    Papeda Restaurant
                  </span>
                  <span className={styles.mailDate}>{formatTanggal(m.dijawab_at)}</span>
                  {baruIds.includes(m.id) && <span className={styles.mailBaru}>Baru</span>}
                </div>
                <p className={styles.mailQ}>
                  <strong>Pertanyaan Anda:</strong> {m.pertanyaan}
                </p>
                <p className={styles.mailA}>{m.jawaban}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal.Body>
    </Modal>
  );
}
