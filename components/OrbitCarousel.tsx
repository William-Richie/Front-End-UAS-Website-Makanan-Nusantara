'use client';

import { useMemo } from 'react';
import Image from 'next/image';

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
  // Selalu siapkan array 5 slot (1 sampai 5)
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
          <i
            key={i}
            className="fa-solid fa-pepper-hot"
            style={{ color: '#c0392b', fontSize: '0.85em', marginLeft: '3px' }}
          />
        ))}
      </span>
    );
  };

  return (
    <section id="favorite-menus" className="page-section py-5">
      <div className="content-container text-content text-center">
        <p className="hero-eyebrow reveal">Chef&apos;s Recommendation</p>
        <h2 className="section-title reveal">Our Favorite Menus</h2>

        {/* Orbit Path 3D */}
        <div className="orbit-wrapper reveal mt-5 position-relative mx-auto">
          <div className="orbit-path position-absolute" id="dynamic-orbit-path">
            {items.map((item, index) => {
              const isFilled = Boolean(item && item.nama_makanan);
              return (
                <div
                  key={index}
                  className="orbit-item"
                  style={!isFilled ? { border: '2px dashed #c9a17a' } : undefined}
                >
                  {isFilled && item?.gambar ? (
                    <img
                      src={item.gambar}
                      alt={item.nama_makanan || 'Menu Favorit'}
                    />
                  ) : (
                    <Image
                      src="/img/Web-Icon/Papeda-icon.png"
                      alt="Coming Soon"
                      width={60}
                      height={60}
                      style={{ objectFit: 'contain', padding: '20px' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Description Rotator (Synced via CSS animation) */}
        <div
          className="menu-desc-container position-relative mx-auto mt-4"
          id="dynamic-desc-container"
        >
          {items.map((item, index) => {
            const isFilled = Boolean(item && item.nama_makanan);
            return (
              <div key={index} className="menu-desc-item text-center">
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
      </div>
    </section>
  );
}
