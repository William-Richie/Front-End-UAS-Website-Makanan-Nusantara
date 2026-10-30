'use client';

import { useState, useEffect } from 'react';
import styles from './IntroOverlay.module.css';
import Image from 'next/image';
import { Container, Button } from 'react-bootstrap';

interface IntroOverlayProps {
  onEnter: () => void;
}

export default function IntroOverlay({ onEnter }: IntroOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const isEntered = sessionStorage.getItem('hasEntered') === 'true';
    if (isEntered) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStart = () => {
    sessionStorage.setItem('hasEntered', 'true');
    setVisible(false);
    onEnter();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('papeda:reveal'));
    }, 150);
  };

  if (!visible) return null;

  return (
    <div id="intro" className={styles.intro}>
      <Container className="mb-4">
        <p className={`${styles.introEyebrow} mb-2`}>Cita Rasa Timur Indonesia</p>
        <h1 className={`${styles.introTitle} mb-2`}>Papeda Restaurant</h1>
        <p className={`${styles.introSub} mb-0`}>Dari sagu hingga kuah kuning, semua dimulai dari sini.</p>
      </Container>

      <div className={`${styles.introTable} w-100 py-4`}>
        <div className="d-flex flex-nowrap justify-content-center align-items-center gap-1 gap-md-5 px-2 px-md-3">
          <div className={`${styles.introItem} ${styles.item0}`}>
            <Image src="/img/intro/spatula.png" alt="Spatula" width={60} height={60} />
          </div>
          <div className={`${styles.introItem} ${styles.item1}`}>
            <Image src="/img/intro/tepung.png" alt="Tepung sagu" width={60} height={60} />
          </div>
          <div className={`${styles.introItem} ${styles.item2}`}>
            <Image src="/img/intro/rempah.png" alt="Rempah" width={60} height={60} />
          </div>
          <div className={`${styles.introItem} ${styles.item3}`}>
            <Image src="/img/intro/kelapa.png" alt="Kelapa" width={60} height={60} />
          </div>
          <div className={`${styles.introItem} ${styles.item4}`}>
            <Image src="/img/intro/bumbu.png" alt="Bumbu" width={60} height={60} />
          </div>
          <div className={`${styles.introItem} ${styles.item5}`}>
            <Image src="/img/intro/garam.png" alt="Garam" width={60} height={60} />
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        id="btn-start"
        className={`${styles.introBtn} rounded-pill px-5 py-2 mt-5`}
        onClick={handleStart}
      >
        Masuk ke Restoran <i className="fa-solid fa-arrow-right ms-2"></i>
      </Button>
    </div>
  );
}