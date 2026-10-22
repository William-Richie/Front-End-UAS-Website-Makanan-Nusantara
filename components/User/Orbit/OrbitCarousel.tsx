'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Container } from 'react-bootstrap';
import styles from './OrbitCarousel.module.css';

export interface FavoriteItem {
  id?: number;
  nama_makanan?: string;
  gambar?: string;
  pedas?: number;
  deskripsi?: string | null;
  slot?: number;
}

interface OrbitCarouselProps {
  favorites?: FavoriteItem[];
}

export default function OrbitCarousel({ favorites = [] }: OrbitCarouselProps) {
  const items = useMemo(() => {
    const list: (FavoriteItem | null)[] = [];
    for (let i = 0; i < 5; i++) {
      const found = favorites[i] || null;
      list.push(found);
    }
    return list;
  }, [favorites]);

  const renderChiliIcons = (level?: number) => {
    const l = Math.max(0, Math.min(5, Number(level) || 0));
    if (l === 0) return null;
    return (
      <span className="ms-2 d-inline-flex align-items-center">
        {Array.from({ length: l }).map((_, i) => (
          <i key={i} className={`fa-solid fa-pepper-hot ${styles.chili}`} />
        ))}
      </span>
    );
  };

  return (
    <section id="favorite-menus" className="page-section py-5">
      <Container className="content-container text-content text-center">
        <p className="hero-eyebrow reveal">Chef&apos;s Recommendation</p>
        <h2 className="section-title reveal">Our Favorite Menus</h2>

        <div className={`${styles.orbitWrapper} reveal mt-5 position-relative mx-auto`}>
          <div className={`${styles.orbitPath} position-absolute`} id="dynamic-orbit-path">
            {items.map((item, index) => {
              const isFilled = Boolean(item && item.nama_makanan);
              return (
                <div
                  key={index}
                  className={`${styles.orbitItem} ${isFilled ? '' : styles.empty}`}
                  style={{ '--angle': `${180 + index * 72}deg` } as React.CSSProperties}
                >
                  {isFilled && item?.gambar ? (
                    <Image
                      src={item.gambar}
                      alt={item.nama_makanan || 'Menu Favorit'}
                      fill
                      sizes="(max-width: 767px) 76px, 130px"
                      className={styles.orbitImg}
                    />
                  ) : (
                    <Image
                      src="/img/Web-Icon/Papeda-icon.png"
                      alt="Coming Soon"
                      width={60}
                      height={60}
                      className={styles.placeholderImg}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`${styles.descContainer} position-relative mx-auto mt-4`}
          id="dynamic-desc-container"
        >
          {items.map((item, index) => {
            const isFilled = Boolean(item && item.nama_makanan);
            return (
              <div
                key={index}
                className={`${styles.descItem} text-center`}
                style={{ '--k': index } as React.CSSProperties}
              >
                {isFilled ? (
                  <>
                    <h4 className="fw-bold mb-1 d-flex justify-content-center align-items-center">
                      {item?.nama_makanan}
                      {renderChiliIcons(item?.pedas)}
                    </h4>
                    <p className="small text-muted mb-0">
                      {item?.deskripsi ||
                        'Sajian lezat dengan bumbu khas rempah Timur Indonesia.'}
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="fw-bold mb-1 text-muted">Menu Segera Hadir</h4>
                    <p className="small text-muted mb-0">
                      Nantikan rekomendasi masakan spesial dari Chef kami berikutnya.
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}