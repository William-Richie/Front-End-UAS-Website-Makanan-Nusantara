'use client';

import { useState } from 'react';
import { Container, Accordion, Modal, Form, Button } from 'react-bootstrap';
import styles from './FaqSection.module.css';

export interface FaqItem {
  id: number;
  pertanyaan: string;
  jawaban: string;
}

interface FaqSectionProps {
  faqList?: FaqItem[];
  onSuccessNotification?: (msg: string) => void;
}

export default function FaqSection({
  faqList = [],
  onSuccessNotification,
}: FaqSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [pertanyaan, setPertanyaan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOpenModal = () => {
    setNama('');
    setEmail('');
    setPertanyaan('');
    setErrorMsg('');
    setIsSubmitted(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pertanyaan.trim().length < 10) {
      setErrorMsg('Pertanyaan minimal 10 karakter ya.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Format email belum benar.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/faq/pertanyaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: nama.trim(), email: email.trim(), pertanyaan: pertanyaan.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengirim pertanyaan.');
      }

      setIsSubmitted(true);
      onSuccessNotification?.('Pertanyaan Anda berhasil dikirim!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pertanyaan. Silakan coba lagi.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section id="faq" className="page-section">
        <div className="hero-banner sec-hero">
          <div className="sec-hero-bg" aria-hidden="true">
            <span className="sec-rings"></span>
            <span className="sec-float f1"><i className="fa-solid fa-leaf"></i></span>
            <span className="sec-float f2"><i className="fa-solid fa-circle-question"></i></span>
            <span className="sec-float f3"><i className="fa-solid fa-comments"></i></span>
          </div>
          <span className="sec-q s1" aria-hidden="true"><i className="fa-solid fa-circle-question"></i></span>
          <span className="sec-q s2" aria-hidden="true"><i className="fa-solid fa-question"></i></span>
          <span className="sec-q s3" aria-hidden="true"><i className="fa-solid fa-question"></i></span>
          <span className="sec-q s4" aria-hidden="true"><i className="fa-solid fa-circle-question"></i></span>

          <Container className="text-center position-relative">
            <p className="hero-eyebrow reveal">Pertanyaan Umum</p>
            <h1 className="faq-title sec-title reveal reveal-d1" id="faq-title">
              Frequently Asked<br /><em>Questions</em>
            </h1>
            <ul className="loc-chips reveal reveal-d2">
              <li>
                <i className="fa-solid fa-list-check"></i>
                <span id="faq-total">Jawaban Cepat</span>
              </li>
              <li>
                <i className="fa-solid fa-comments"></i>
                <span id="faq-chip2">Tanya Langsung ke Kami</span>
              </li>
            </ul>
          </Container>
        </div>

        <div className={styles.faqWrap}>
        <Container className="content-container">
          <div className={styles.faqGrid}>
            <div className={styles.faqAsideCol}>
              <aside className={`${styles.faqAside} reveal`}>
                <div className={styles.faqAsideBody}>
                  <div className={styles.faqAsideIcon}>
                    <i className="fa-solid fa-comments"></i>
                  </div>
                  <p className="sec-kicker" id="faq-aside-kicker">Masih Penasaran?</p>
                  <h2 id="faq-aside-title">Let us know !</h2>
                  <div className={`mc-orn ${styles.asideOrn}`}>
                    <span></span><i className="fa-solid fa-leaf"></i><span></span>
                  </div>
                  <p className={styles.faqAsideDesc} id="faq-aside-desc">
                    Tulis pertanyaan Anda, tim kami akan membacanya dan menambahkannya ke FAQ bila sering ditanyakan.
                  </p>
                  <Button
                    variant="papeda"
                    className={styles.askBtn}
                    onClick={handleOpenModal}
                  >
                    <i className="fa-solid fa-pen-to-square me-2"></i>
                    <span id="faq-aside-btn">Tulis Pertanyaan</span>
                  </Button>
                </div>
              </aside>
            </div>

            <div className={`${styles.faqList} d-flex flex-column`} id="tempat-faq-dinamis">
              {faqList.length === 0 ? (
                <p className={styles.faqEmpty}>
                  <i className="fa-regular fa-circle-question me-2"></i>Belum ada FAQ yang tersedia.
                </p>
              ) : (
                <Accordion className={styles.faqAccordion}>
                  {faqList.map((item, i) => (
                    <Accordion.Item
                      key={item.id}
                      eventKey={item.id.toString()}
                      className={styles.faqItem}
                    >
                      <Accordion.Header>
                        <span className={styles.faqNum}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className={styles.faqQText}>{item.pertanyaan}</span>
                      </Accordion.Header>
                      <Accordion.Body className={styles.faqAnswerWrap}>
                        <div className={styles.faqAnswer}>{item.jawaban}</div>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </Container>
        </div>
      </section>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        dialogClassName={styles.faqDialog}
        backdropClassName={styles.faqBackdrop}
        contentClassName={`${styles.faqModal} border-0 position-relative`}
      >
        <button
          type="button"
          className={`btn-close ${styles.modalClose}`}
          onClick={() => setShowModal(false)}
          aria-label="Tutup"
        />

        {!isSubmitted ? (
          <>
            <Modal.Header className={`${styles.faqModalHead} border-0 d-block text-center`}>
              <div className={`${styles.faqModalIcon} mx-auto`}>
                <span className={styles.faqModalIconInner}>
                  <i className="fa-solid fa-question"></i>
                </span>
              </div>
              <h3 className="mt-3">Drop a Question</h3>
              <p>Pertanyaan Anda akan dibaca langsung oleh tim Papeda Restaurant</p>
            </Modal.Header>

            <Modal.Body>
              <Form className={styles.faqModalBody} onSubmit={handleSubmit}>
                <Form.Group className={`${styles.faqField} mb-3`}>
                  <Form.Label htmlFor="faq-nama">
                    Nama <span>(opsional)</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    id="faq-nama"
                    maxLength={40}
                    placeholder="Nama Anda"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className={`${styles.faqField} mb-3`}>
                  <Form.Label htmlFor="faq-email">
                    Email <span>(opsional)</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    id="faq-email"
                    maxLength={100}
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className={`${styles.faqField} mb-3`}>
                  <Form.Label htmlFor="faq-text">Pertanyaan Anda</Form.Label>
                  <Form.Control
                    as="textarea"
                    id="faq-text"
                    rows={4}
                    maxLength={300}
                    placeholder="Contoh: Apakah tersedia menu tanpa pedas untuk anak-anak?"
                    required
                    value={pertanyaan}
                    onChange={(e) => setPertanyaan(e.target.value)}
                  />
                  <div className={`${styles.faqCounter} text-end`}>
                    <small>{pertanyaan.length}/300</small>
                  </div>
                </Form.Group>

                {errorMsg && (
                  <p className={styles.faqError} role="alert">
                    {errorMsg}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  variant="papeda"
                  className={`${styles.orderBtn} w-100 mt-3`}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin me-2"></i>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane me-2"></i>
                      Kirim Pertanyaan
                    </>
                  )}
                </Button>
              </Form>
            </Modal.Body>
          </>
        ) : (
          <Modal.Body className={`${styles.faqSuccess} text-center p-4`}>
            <div className={`${styles.faqSuccessIcon} mb-3`}>
              <i className="fa-solid fa-check"></i>
            </div>
            <h3>Terima kasih!</h3>
            <p>Pertanyaan Anda sudah kami terima dan akan segera kami baca.</p>
            <Button
              variant="papeda"
              className="mt-3"
              onClick={() => setShowModal(false)}
            >
              Tutup
            </Button>
          </Modal.Body>
        )}
      </Modal>
    </>
  );
}