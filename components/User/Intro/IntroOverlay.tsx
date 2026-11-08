'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './IntroOverlay.module.css';
import Image from 'next/image';
import { Container, Button } from 'react-bootstrap';

interface IntroOverlayProps {
  onEnter: () => void;
}

const ITEMS = [
  { src: '/img/intro/spatula.png', alt: 'Spatula' },
  { src: '/img/intro/tepung.png', alt: 'Tepung sagu' },
  { src: '/img/intro/rempah.png', alt: 'Rempah' },
  { src: '/img/intro/kelapa.png', alt: 'Kelapa' },
  { src: '/img/intro/bumbu.png', alt: 'Bumbu' },
  { src: '/img/intro/garam.png', alt: 'Garam' },
];

const MAX_WAIT_MS = 4000;

export default function IntroOverlay({ onEnter }: IntroOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [imagesReady, setImagesReady] = useState(false);
  const loaded = useRef<Set<number>>(new Set());

  useEffect(() => {
    const isEntered = sessionStorage.getItem('hasEntered') === 'true';
    if (isEntered) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setImagesReady(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleImageDone = (index: number) => {
    loaded.current.add(index);
    if (loaded.current.size >= ITEMS.length) setImagesReady(true);
  };

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
    <div id="intro" className={`${styles.intro} ${imagesReady ? styles.ready : ''}`}>
      <Container className="mb-4">
        <p className={`${styles.introEyebrow} mb-2`}>Cita Rasa Timur Indonesia</p>
        <h1 className={`${styles.introTitle} mb-2`}>Papeda Restaurant</h1>
        <p className={`${styles.introSub} mb-0`}>Dari sagu hingga kuah kuning, semua dimulai dari sini.</p>
      </Container>

      <div className={`${styles.introTable} w-100 py-4`}>
        <div className="d-flex flex-nowrap justify-content-center align-items-center gap-1 gap-md-5 px-2 px-md-3">
          {ITEMS.map((item, i) => (
            <div key={item.src} className={`${styles.introItem} ${styles[`item${i}`]}`}>
              <Image
                src={item.src}
                alt={item.alt}
                width={60}
                height={60}
                loading="eager"
                fetchPriority="high"
                onLoad={() => handleImageDone(i)}
                onError={() => handleImageDone(i)}
              />
            </div>
          ))}
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
