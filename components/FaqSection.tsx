'use client';

import { useState } from 'react';

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
  const [openId, setOpenId] = useState<number | null>(null);

  // State Form Modal Tulis Pertanyaan
  const [showModal, setShowModal] = useState(false);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [pertanyaan, setPertanyaan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleFaq = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

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
      <section id="faq" className="page-section faq-section">
        <div className="hero-banner sec-hero">
          <div className="sec-hero-bg" aria-hidden="true">
            <span className="sec-rings"></span>
            <span className="sec-float f1"><i className="fa-solid fa-leaf"></i></span>
            <span className="sec-float f2"><i className="fa-solid fa-circle-question"></i></span>
            <span className="sec-float f3"><i className="fa-solid fa-comments"></i></span>
          </div>

          <div className="container text-center position-relative section-content-wrap">
            <p className="hero-eyebrow reveal">Pertanyaan Umum</p>
            <h1 className="faq-title reveal reveal-d1" id="faq-title">
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
          </div>
        </div>

        <div className="content-container faq-wrap">
          <div className="faq-grid">
            {/* Aside Column */}
            <div className="faq-aside-col">
              <aside className="faq-aside reveal">
                <div className="faq-aside-body">
                  <div className="faq-aside-icon">
                    <i className="fa-solid fa-comments"></i>
                  </div>
                  <p className="loc-kicker" id="faq-aside-kicker">Masih Penasaran?</p>
                  <h2 id="faq-aside-title">Let us know !</h2>
                  <div className="mc-orn">
                    <span></span><i className="fa-solid fa-leaf"></i><span></span>
                  </div>
                  <p className="faq-aside-desc" id="faq-aside-desc">
                    Tulis pertanyaan Anda, tim kami akan membacanya dan menambahkannya ke FAQ bila sering ditanyakan.
                  </p>
                  <button
                    type="button"
                    className="btn-map-open faq-ask-btn"
                    onClick={handleOpenModal}
                  >
                    <i className="fa-solid fa-pen-to-square me-2"></i>
                    <span id="faq-aside-btn">Tulis Pertanyaan</span>
                  </button>
                </div>
              </aside>
            </div>

            {/* List Accordion Column */}
            <div className="faq-list d-flex flex-column" id="tempat-faq-dinamis">
              {faqList.length === 0 ? (
                <p className="faq-empty">
                  <i className="fa-regular fa-circle-question me-2"></i>Belum ada FAQ yang tersedia.
                </p>
              ) : (
                faqList.map((item, i) => {
                  const isOpen = openId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`faq-item ${isOpen ? 'open' : ''}`}
                    >
                      <div
                        className="faq-question fw-bold"
                        style={{ '--d': `${Math.min(i, 8) * 0.08}s` } as React.CSSProperties}
                        onClick={() => toggleFaq(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleFaq(item.id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                      >
                        <span className="faq-num">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="faq-q-text">{item.pertanyaan}</span>
                        <span className="faq-chevron">
                          <i className="fa-solid fa-chevron-down"></i>
                        </span>
                      </div>
                      <div className="faq-answer-wrap" inert={!isOpen}>
                        <div className="faq-answer-clip">
                          <div className="faq-answer d-block">{item.jawaban}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal Tanya FAQ */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content faq-modal border-0 position-relative">
              <button
                type="button"
                className="btn-close mm-close"
                onClick={() => setShowModal(false)}
                aria-label="Tutup"
              />

              {!isSubmitted ? (
                <>
                  <div className="faq-modal-head">
                    <div className="faq-modal-icon">
                      <i className="fa-solid fa-circle-question"></i>
                    </div>
                    <h3>Drop a Question</h3>
                    <p>Pertanyaan Anda akan dibaca langsung oleh tim Papeda Restaurant</p>
                  </div>

                  <form className="faq-modal-body" onSubmit={handleSubmit}>
                    <div className="faq-field">
                      <label htmlFor="faq-nama">
                        Nama <span>(opsional)</span>
                      </label>
                      <input
                        type="text"
                        id="faq-nama"
                        className="form-control"
                        maxLength={40}
                        placeholder="Nama Anda"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                      />
                    </div>

                    <div className="faq-field">
                      <label htmlFor="faq-email">
                        Email <span>(opsional)</span>
                      </label>
                      <input
                        type="email"
                        id="faq-email"
                        className="form-control"
                        maxLength={100}
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="faq-field">
                      <label htmlFor="faq-text">Pertanyaan Anda</label>
                      <textarea
                        id="faq-text"
                        className="form-control"
                        rows={4}
                        maxLength={300}
                        placeholder="Contoh: Apakah tersedia menu tanpa pedas untuk anak-anak?"
                        required
                        value={pertanyaan}
                        onChange={(e) => setPertanyaan(e.target.value)}
                      />
                      <div className="faq-counter">
                        <span>{pertanyaan.length}/300</span>
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="faq-error" role="alert">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn mm-order-btn w-100"
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
                    </button>
                  </form>
                </>
              ) : (
                <div className="faq-success text-center p-4">
                  <div className="faq-success-icon mb-3">
                    <i className="fa-solid fa-check text-success fs-1"></i>
                  </div>
                  <h3>Terima kasih!</h3>
                  <p>Pertanyaan Anda sudah kami terima dan akan segera kami baca.</p>
                  <button
                    type="button"
                    className="btn btn-papeda mt-3"
                    onClick={() => setShowModal(false)}
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}