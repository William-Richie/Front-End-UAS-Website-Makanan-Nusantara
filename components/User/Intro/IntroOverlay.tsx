'use client';

import { useState, useEffect } from 'react';
import styles from './IntroOverlay.module.css';
import Image from 'next/image';
import { Container, Button } from 'react-bootstrap';

const INTRO_IMAGES = [
  '/img/intro/spatula.png',
  '/img/intro/tepung.png',
  '/img/intro/rempah.png',
  '/img/intro/kelapa.png',
  '/img/intro/bumbu.png',
  '/img/intro/garam.png',
];

interface IntroOverlayProps {
  onEnter: () => void;
}

export default function IntroOverlay({ onEnter }: IntroOverlayProps) {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const isEntered = sessionStorage.getItem('hasEntered') === 'true';
    const timer = setTimeout(() =>
        setVisible(!isEntered)
      , 0);
      return () => clearTimeout(timer);
  }, []);

  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const preload = Promise.allSettled(
      INTRO_IMAGES.map((src) => {
        const img = new window.Image();
        img.src = src;
        return img.decode();
      })
    );
    const timeout = new Promise((r) => setTimeout(r, 2500));

    Promise.race([preload, timeout]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => { cancelled = true; };
  }, []);

  const handleStart = () => {
  if (leaving) return;
  sessionStorage.setItem('hasEntered', 'true');
  setLeaving(true);
  onEnter();
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('papeda:reveal'));
  }, 150);
  setTimeout(() => setVisible(false), 800); 
};

  if (!visible) return null;

  return (
    <div id="intro" className={`${styles.intro} ${ready ? styles.ready : ''} ${leaving ? styles.leaving : ''}`}>
      <Container className="mb-4">
        <p className={`${styles.introEyebrow} mb-2`}>Cita Rasa Timur Indonesia</p>
        <h1 className={`${styles.introTitle} mb-2`}>Papeda Restaurant</h1>
        <p className={`${styles.introSub} mb-0`}>Dari sagu hingga kuah kuning, semua dimulai dari sini.</p>
      </Container>

      <div className={`${styles.introTable} w-100 py-4`}>
        <div className="d-flex flex-nowrap justify-content-center align-items-center">
          <div className={`${styles.introItem} ${styles.item0}`}>
            <Image src="/img/intro/spatula.png" alt="Spatula" width={60} height={60} priority unoptimized/>
          </div>
          <div className={`${styles.introItem} ${styles.item1}`}>
            <Image src="/img/intro/tepung.png" alt="Tepung sagu" width={60} height={60} priority unoptimized/>
          </div>
          <div className={`${styles.introItem} ${styles.item2}`}>
            <Image src="/img/intro/rempah.png" alt="Rempah" width={60} height={60} priority unoptimized/>
          </div>
          <div className={`${styles.introItem} ${styles.item3}`}>
            <Image src="/img/intro/kelapa.png" alt="Kelapa" width={60} height={60} priority unoptimized/>
          </div>
          <div className={`${styles.introItem} ${styles.item4}`}>
            <Image src="/img/intro/bumbu.png" alt="Bumbu" width={60} height={60} priority unoptimized/>
          </div>
          <div className={`${styles.introItem} ${styles.item5}`}>
            <Image src="/img/intro/garam.png" alt="Garam" width={60} height={60} priority unoptimized/>
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