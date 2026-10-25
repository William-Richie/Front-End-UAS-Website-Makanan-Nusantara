'use client';

import Image from 'next/image';
import { Container, Row, Col } from 'react-bootstrap';
import styles from './Hero.module.css';

interface HeroProps {
  teksHero?: string | null;
}

export default function Hero({ teksHero }: HeroProps) {
  return (
    <section id="home" className="page-section">
      <div className={`${styles.heroPapeda} position-relative overflow-hidden`}>
        <Container fluid className={styles.heroContent}>
          <Row className="align-items-center g-4">
            <Col md={6} className="text-start">
              <p className="hero-eyebrow reveal" id="hero-eyebrow">
                Cita Rasa Timur Indonesia
              </p>
              <h1 id="judul-hero" className={`${styles.heroTitle} reveal reveal-d1`}>
                Welcome to Our Papeda Restaurant
              </h1>
              <p className={`${styles.heroSub} mx-auto mx-md-0 reveal reveal-d2`} id="hero-sub">
                Cita rasa asli Timur Indonesia, dari sagu hingga kuah kuning.
              </p>
              <div className="d-flex gap-2 justify-content-start reveal reveal-d3">
                <a href="#menu" className={styles.heroBtn}>
                  Lihat Menu
                </a>
                <a href="#reservation" className={styles.heroBtnOutline}>
                  Reservasi
                </a>
              </div>
            </Col>

            <Col md={6} className="d-flex justify-content-center">
              <div className={`${styles.papedaArea} position-relative`}>
                <span className={`${styles.foodIcon} ${styles.chili} position-absolute`}>
                  <i className="fa-solid fa-pepper-hot"></i>
                </span>
                <span className={`${styles.foodIcon} ${styles.lime} position-absolute`}>
                  <i className="fa-solid fa-lemon"></i>
                </span>
                <span className={`${styles.foodIcon} ${styles.fish1} position-absolute`}>
                  <i className="fa-solid fa-fish"></i>
                </span>
                <span className={`${styles.foodIcon} ${styles.fish2} position-absolute`}>
                  <i className="fa-solid fa-fish"></i>
                </span>
                <span className={`${styles.foodIcon} ${styles.star} ${styles.star1} position-absolute`}>
                  <i className="fa-solid fa-star"></i>
                </span>
                <span className={`${styles.foodIcon} ${styles.star} ${styles.star2} position-absolute`}>
                  <i className="fa-solid fa-star"></i>
                </span>

                <Image
                  src="/img/papeda-icon.png"
                  alt="Papeda"
                  width={600}
                  height={350}
                  className={styles.papedaImg}
                  priority
                />
                <Image
                  src="/img/asap.png"
                  alt=""
                  width={150}
                  height={150}
                  className={styles.smokeImg}
                />
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </section>
  );
}