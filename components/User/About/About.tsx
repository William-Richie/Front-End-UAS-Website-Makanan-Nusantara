'use client';

import { Container, Row, Col } from 'react-bootstrap';
import styles from './About.module.css';

interface AboutProps {
  teksAbout?: string | null;
}

export default function About({ teksAbout }: AboutProps) {
  return (
    <section id="about" className={`page-section ${styles.about}`}>
      <Container className="content-container text-content">
        <div className="text-center mb-4 reveal">
          <p className="hero-eyebrow" id="about-eyebrow">
            Tentang Kami
          </p>
          <h2 className="section-title" id="about-title">
            Warisan Rasa dari Timur
          </h2>
          <p id="about-desc" className={`mx-auto ${styles.aboutDesc}`}>
            {teksAbout ||
              'Selamat datang di Papeda Restaurant, tempat terbaik untuk menikmati hidangan khas Nusantara Timur. Kami menyajikan berbagai menu tradisional dengan cita rasa otentik yang akan memanjakan lidah Anda.'}
          </p>
        </div>

        <Row xs={1} md={3} className="g-3">
          <Col className="reveal reveal-d1">
            <div className={`${styles.featureCard} h-100 text-center`}>
              <div className={styles.featureIcon}>
                <i className="fa-solid fa-leaf"></i>
              </div>
              <h3 id="card1-title" className={styles.featureTitle}>Bahan Segar</h3>
              <p id="card1-desc" className={styles.featureDesc}>
                Sagu dan hasil laut dipilih segar setiap hari.
              </p>
            </div>
          </Col>
          <Col className="reveal reveal-d2p5">
            <div className={`${styles.featureCard} h-100 text-center`}>
              <div className={styles.featureIcon}>
                <i className="fa-solid fa-fire"></i>
              </div>
              <h3 id="card2-title" className={styles.featureTitle}>Resep Turun-temurun</h3>
              <p id="card2-desc" className={styles.featureDesc}>
                Resep rahasia yang menjaga keaslian rasa.
              </p>
            </div>
          </Col>
          <Col className="reveal reveal-d4">
            <div className={`${styles.featureCard} h-100 text-center`}>
              <div className={styles.featureIcon}>
                <i className="fa-solid fa-heart"></i>
              </div>
              <h3 id="card3-title" className={styles.featureTitle}>Disajikan Sepenuh Hati</h3>
              <p id="card3-desc" className={styles.featureDesc}>
                Suasana hangat ala rumah, cocok untuk keluarga.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}