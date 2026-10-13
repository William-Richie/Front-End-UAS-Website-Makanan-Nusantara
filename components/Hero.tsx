'use client';

import Image from 'next/image';

interface HeroProps {
  teksHero?: string | null;
}

export default function Hero({ teksHero }: HeroProps) {
  return (
    <section id="home" className="page-section">
      <div className="hero-papeda position-relative overflow-hidden">
        <div className="container py-5 position-relative hero-content-wrap">
          <div className="row align-items-center g-4 py-md-4">
            {/* Kolom Teks */}
            <div className="col-md-6 text-center text-md-start">
              <p className="hero-eyebrow reveal" id="hero-eyebrow">
                Cita Rasa Timur Indonesia
              </p>
              <h1 id="judul-hero" className="reveal reveal-d1">
                Welcome to Our
                <br />
                Papeda Restaurant
              </h1>
              <p className="hero-sub mx-auto mx-md-0 reveal reveal-d2" id="hero-sub">
                {teksHero || 'Cita rasa asli Timur Indonesia, dari sagu hingga kuah kuning.'}
              </p>
              <div className="d-flex gap-2 justify-content-center justify-content-md-start reveal reveal-d3">
                <a href="#menu" className="btn hero-btn">
                  Lihat Menu
                </a>
                <a href="#reservation" className="btn hero-btn-outline">
                  Reservasi
                </a>
              </div>
            </div>

            {/* Kolom Gambar */}
            <div className="col-md-6 d-flex justify-content-center">
              <div className="papeda-area position-relative">
                <span className="food-icon chili position-absolute">
                  <i className="fa-solid fa-pepper-hot"></i>
                </span>
                <span className="food-icon lime position-absolute">
                  <i className="fa-solid fa-lemon"></i>
                </span>
                <span className="food-icon fish-1 position-absolute">
                  <i className="fa-solid fa-fish"></i>
                </span>
                <span className="food-icon fish-2 position-absolute">
                  <i className="fa-solid fa-fish"></i>
                </span>
                <span className="food-icon star star-1 position-absolute">
                  <i className="fa-solid fa-star"></i>
                </span>
                <span className="food-icon star star-2 position-absolute">
                  <i className="fa-solid fa-star"></i>
                </span>

                <Image
                  src="/img/papeda-icon.png"
                  alt="Papeda"
                  width={280}
                  height={280}
                  className="papeda-img"
                  priority
                />
                <Image
                  src="/img/asap.png"
                  alt="Asap"
                  width={150}
                  height={150}
                  className="smoke-img position-absolute"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
