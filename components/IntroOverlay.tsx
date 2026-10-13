'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
    <div id="intro" className="d-flex flex-column justify-content-center align-items-center text-center">
      <div className="container mb-4">
        <p className="intro-eyebrow mb-2">Cita Rasa Timur Indonesia</p>
        <h1 className="intro-title display-4 mb-2">Papeda Restaurant</h1>
        <p className="intro-sub mb-0">Dari sagu hingga kuah kuning, semua dimulai dari sini.</p>
      </div>

      {/* Intro */}
      <div className="intro-table w-100 py-4">
        <div className="d-flex flex-nowrap justify-content-center align-items-center gap-1 gap-md-5 px-2 px-md-3">
          <div className="intro-item intro-item-0">
            <Image src="/img/intro/spatula.png" alt="Spatula" width={60} height={60} />
          </div>
          <div className="intro-item intro-item-1">
            <Image src="/img/intro/tepung.png" alt="Tepung sagu" width={60} height={60} />
          </div>
          <div className="intro-item intro-item-2">
            <Image src="/img/intro/rempah.png" alt="Rempah" width={60} height={60} />
          </div>
          <div className="intro-item intro-item-3">
            <Image src="/img/intro/kelapa.png" alt="Kelapa" width={60} height={60} />
          </div>
          <div className="intro-item intro-item-4">
            <Image src="/img/intro/bumbu.png" alt="Bumbu" width={60} height={60} />
          </div>
          <div className="intro-item intro-item-5">
            <Image src="/img/intro/garam.png" alt="Garam" width={60} height={60} />
          </div>
        </div>
      </div>

      <button
        type="button"
        id="btn-start"
        className="intro-btn btn rounded-pill px-5 py-2 mt-5"
        onClick={handleStart}
      >
        Masuk ke Restoran <i className="fa-solid fa-arrow-right ms-2"></i>
      </button>
    </div>
  );
}
