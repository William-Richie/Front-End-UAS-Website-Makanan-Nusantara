'use client';

interface AboutProps {
  teksAbout?: string | null;
}

export default function About({ teksAbout }: AboutProps) {
  return (
    <section id="about" className="page-section">
      <div className="content-container text-content">
        <div className="text-center mb-4 reveal">
          <p className="hero-eyebrow" id="about-eyebrow">
            Tentang Kami
          </p>
          <h2 className="section-title" id="about-title">
            Warisan Rasa dari Timur
          </h2>
          <p id="deskripsi-about" className="mx-auto about-desc">
            {teksAbout ||
              'Selamat datang di Papeda Restaurant, tempat terbaik untuk menikmati hidangan khas Nusantara Timur. Kami menyajikan berbagai menu tradisional dengan cita rasa otentik yang akan memanjakan lidah Anda.'}
          </p>
        </div>

        <div className="row row-cols-1 row-cols-md-3 g-3">
          <div className="col reveal reveal-d1">
            <div className="feature-card h-100 text-center">
              <div className="feature-icon">
                <i className="fa-solid fa-leaf"></i>
              </div>
              <h3 id="card1-title">Bahan Segar</h3>
              <p id="card1-desc">
                Sagu dan hasil laut dipilih segar setiap hari.
              </p>
            </div>
          </div>
          <div className="col reveal reveal-d2p5">
            <div className="feature-card h-100 text-center">
              <div className="feature-icon">
                <i className="fa-solid fa-fire"></i>
              </div>
              <h3 id="card2-title">Resep Turun-temurun</h3>
              <p id="card2-desc">
                Resep rahasia yang menjaga keaslian rasa.
              </p>
            </div>
          </div>
          <div className="col reveal reveal-d4">
            <div className="feature-card h-100 text-center">
              <div className="feature-icon">
                <i className="fa-solid fa-heart"></i>
              </div>
              <h3 id="card3-title">Disajikan Sepenuh Hati</h3>
              <p id="card3-desc">
                Suasana hangat ala rumah, cocok untuk keluarga.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
