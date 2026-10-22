'use client';

import { useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import styles from './LocationSection.module.css';
import { BranchMap } from '../Reservation/ReservationSection';

interface LocationSectionProps {
  branches: BranchMap[];
}

export default function LocationSection({ branches }: LocationSectionProps) {
  const [showMap, setShowMap] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchMap | null>(
    branches[0] || null
  );

  const activeBranch = selectedBranch || branches[0];

  return (
    <section id="location" className={`page-section ${styles.locSection}`}>
      <div className={styles.locMotif} aria-hidden="true"></div>

      <div className={styles.locHero}>
        <div className={styles.locHeroBg} aria-hidden="true">
          <span className={styles.locRings}></span>
        </div>

        <span className={`${styles.locPin} ${styles.p1}`} aria-hidden="true"><i className="fa-solid fa-location-dot"></i></span>
        <span className={`${styles.locPin} ${styles.p2}`} aria-hidden="true"><i className="fa-solid fa-map-location-dot"></i></span>
        <span className={`${styles.locPin} ${styles.p3}`} aria-hidden="true"><i className="fa-solid fa-location-dot"></i></span>
        <span className={`${styles.locPin} ${styles.p4}`} aria-hidden="true"><i className="fa-solid fa-map-pin"></i></span>

        <Container className="text-center position-relative">
          <p className="hero-eyebrow reveal" id="loc-eyebrow">Temukan Kami</p>
          <h1 className={`${styles.locTitle} reveal reveal-d1`} id="loc-title">
            Let&apos;s See Our<br /><em>Restaurant Location</em>
          </h1>
          <ul className="loc-chips reveal reveal-d2">
            <li>
              <i className="fa-solid fa-store"></i>
              <span id="banner-total-cabang">{branches.length} Cabang</span>
            </li>
            <li>
              <i className="fa-solid fa-route"></i>
              <span id="loc-chip2">Jakarta hingga Papua</span>
            </li>
          </ul>
        </Container>
      </div>

      <div className={styles.locWrap}>
        <div className={styles.locGrid}>
          <article className={`${styles.locIntro} reveal`}>
            <p className="sec-kicker" id="loc-kicker">Rasakan Cita Rasa Kami</p>
            <h2 id="loc-heading">Warmth in Every Dish, Flavors from Eastern Indonesia</h2>
            <p className={styles.locDesc} id="loc-desc">
              Mampir ke gerai terdekat dan nikmati papeda dengan kuah kuning yang masih hangat. Buka peta untuk menjelajahi semua cabang kami.
            </p>
            <button
              type="button"
              id="btn-open-map"
              className={styles.mapBtn}
              onClick={() => setShowMap((prev) => !prev)}
            >
              <i className="fa-solid fa-location-dot me-2"></i>
              <span id="loc-btn">{showMap ? 'Tutup Peta' : 'Lihat Peta Cabang'}</span>
            </button>
          </article>

          <ul className={styles.locCards}>
            <li className="reveal" style={{ '--d': '0.1s' } as React.CSSProperties}>
              <div className={styles.locCard}>
                <span className={styles.locIcon}><i className="fa-solid fa-location-dot"></i></span>
                <div>
                  <h3 id="loc-utama-title">Cabang Utama</h3>
                  <p id="loc-utama-text">{activeBranch?.alamat || 'Jl. Cendrawasih No. 45, Jakarta'}</p>
                </div>
              </div>
            </li>
            <li className="reveal" style={{ '--d': '0.2s' } as React.CSSProperties}>
              <a className={styles.locCard} id="loc-telp-link" href="tel:+622112345678">
                <span className={styles.locIcon}><i className="fa-solid fa-phone"></i></span>
                <div>
                  <h3 id="loc-telp-title">Telepon</h3>
                  <p id="loc-telp-text">(021) 1234-5678</p>
                </div>
              </a>
            </li>
            <li className="reveal" style={{ '--d': '0.3s' } as React.CSSProperties}>
              <a className={styles.locCard} id="loc-email-link" href="mailto:halo@papedarestaurant.com">
                <span className={styles.locIcon}><i className="fa-solid fa-envelope"></i></span>
                <div>
                  <h3 id="loc-email-title">Email</h3>
                  <p id="loc-email-text">halo@papedarestaurant.com</p>
                </div>
              </a>
            </li>
            <li className="reveal" style={{ '--d': '0.4s' } as React.CSSProperties}>
              <div className={styles.locCard}>
                <span className={styles.locIcon}><i className="fa-solid fa-square-parking"></i></span>
                <div>
                  <h3 id="loc-parkir-title">Parkir</h3>
                  <p id="loc-parkir-text">Area luas untuk roda dua maupun roda empat</p>
                </div>
              </div>
            </li>
          </ul>
        </div>

        {showMap && (
          <div id="map-reveal" className={styles.mapReveal}>
            <div className={styles.mapRevealInner}>
              <div>
                <div id="branch-list" className={`${styles.branchList} d-flex gap-2 overflow-auto pb-3`}>
                  {branches.map((b) => (
                    <Button
                      key={b.id}
                      variant="outline-secondary"
                      size="sm"
                      active={activeBranch?.id === b.id}
                      className={styles.branchBtn}
                      onClick={() => setSelectedBranch(b)}
                    >
                      {b.nama}
                    </Button>
                  ))}
                </div>

                {activeBranch && (
                  <div className={styles.branchDetail}>
                    <h5>{activeBranch.nama}</h5>
                    <p className="text-muted small mb-2">{activeBranch.alamat}</p>
                    <Button
                      as="a"
                      href={`https://www.google.com/maps?q=${activeBranch.latitude},${activeBranch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="papeda"
                      size="sm"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square me-1"></i> Buka di Google Maps
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}