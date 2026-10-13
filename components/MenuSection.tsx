'use client';

import { useState, useMemo } from 'react';

export interface MenuItem {
  id: number;
  nama_kategori: string;
  nama_makanan: string;
  harga: number;
  gambar: string;
  deskripsi?: string | null;
  pedas: number;
  status: boolean;
}

interface MenuSectionProps {
  menus?: MenuItem[];
  onAddToCart?: (menu: MenuItem) => void;
}

export default function MenuSection({
  menus = [],
  onAddToCart,
}: MenuSectionProps) {
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);

  const { grouped, categories, activeCategory } = useMemo(() => {
    const groupedData: Record<string, MenuItem[]> = {};
    menus.forEach((item) => {
      const kat = item.nama_kategori || 'LAINNYA';
      if (!groupedData[kat]) {
        groupedData[kat] = [];
      }
      groupedData[kat].push(item);
    });

    const URUTAN = ['APPETIZER', 'MAIN COURSE', 'DESSERT', 'MINUMAN', 'DRINK', 'ADDITIONAL'];
    const getOrder = (k: string) => {
      const idx = URUTAN.indexOf(k.toUpperCase());
      return idx === -1 ? 99 : idx;
    };

    const sortedCats = Object.keys(groupedData).sort((a, b) => getOrder(a) - getOrder(b));
    return {
      grouped: groupedData,
      categories: sortedCats,
      activeCategory: sortedCats[0] || '',
    };
  }, [menus]);

  const [currentTab, setCurrentTab] = useState<string>('');
  const activeTab = currentTab || activeCategory;

  const renderChili = (level: number) => {
    const l = Math.max(0, Math.min(5, level || 0));
    if (l === 0) return null;
    return Array.from({ length: l }).map((_, i) => (
      <i key={i} className="fa-solid fa-pepper-hot text-danger me-1"></i>
    ));
  };

  return (
    <>
      <section id="menu" className="page-section">
        <div className="hero-banner sec-hero">
          <div className="sec-hero-bg" aria-hidden="true">
            <span className="sec-rings"></span>
            <span className="sec-float f1"><i className="fa-solid fa-leaf"></i></span>
            <span className="sec-float f2"><i className="fa-solid fa-pepper-hot"></i></span>
            <span className="sec-float f3"><i className="fa-solid fa-fish"></i></span>
          </div>
          <span className="sec-q s1" aria-hidden="true"><i className="fa-solid fa-fish"></i></span>
          <span className="sec-q s2" aria-hidden="true"><i className="fa-solid fa-pepper-hot"></i></span>
          <span className="sec-q s3" aria-hidden="true"><i className="fa-solid fa-bowl-food"></i></span>
          <span className="sec-q s4" aria-hidden="true"><i className="fa-solid fa-lemon"></i></span>

          <div className="container text-center position-relative section-content-wrap">
            <p className="hero-eyebrow reveal">Cita Rasa Timur Nusantara</p>
            <h1 className="sec-title reveal reveal-d1">
              Taste Our Papeda<br /><em>Menu&apos;s</em>
            </h1>
            <ul className="loc-chips reveal reveal-d2">
              <li><i className="fa-solid fa-utensils"></i>{categories.length} Kategori Menu</li>
              <li><i className="fa-solid fa-pepper-hot"></i>Rempah Pilihan</li>
            </ul>
          </div>
        </div>

        <div className="content-container" id="tempat-menu-dinamis">
          {/* Tabs Kategori */}
          <div className="menu-tabs">
            {categories.map((kat) => (
              <button
                key={kat}
                type="button"
                className={`menu-tab ${activeTab === kat ? 'active' : ''}`}
                onClick={() => setCurrentTab(kat)}
              >
                {kat}
              </button>
            ))}
          </div>

          {/* Menu Card Grid */}
          {categories.map((kat) => (
            <div
              key={kat}
              className={`menu-group ${activeTab === kat ? 'active' : ''}`}
              style={{ display: activeTab === kat ? 'block' : 'none' }}
            >
              <div className="category-header">{kat}</div>
              <div className="menu-grid">
                {grouped[kat]?.map((makanan) => {
                  const isTersedia = makanan.status === true;
                  return (
                    <div
                      key={makanan.id}
                      className={`menu-item menu-card ${!isTersedia ? 'menu-kosong' : ''}`}
                    >
                      {!isTersedia && (
                        <div className="status-badge-kosong">Tidak Tersedia</div>
                      )}
                      <div
                        className="mc-photo position-relative"
                        onClick={() => setSelectedMenu(makanan)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={makanan.gambar}
                          alt={makanan.nama_makanan}
                          className="menu-img"
                        />
                        {makanan.pedas > 0 && (
                          <div className="mc-spicy spicy">
                            {renderChili(makanan.pedas)}
                          </div>
                        )}
                        <span className="card-open">
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </span>
                        <span className="mc-detail">
                          <i className="fa-regular fa-eye"></i> Lihat Detail
                        </span>
                      </div>

                      <div className="mc-body">
                        <div className="dish-name">{makanan.nama_makanan}</div>
                        <div className="mc-orn">
                          <span></span>
                          <i className="fa-solid fa-leaf"></i>
                          <span></span>
                        </div>
                        <div className="menu-details">
                          <div className="menu-price">
                            Rp {makanan.harga.toLocaleString('id-ID')}
                          </div>
                          {isTersedia ? (
                            <button
                              type="button"
                              className="add-to-cart-btn"
                              onClick={() => onAddToCart?.(makanan)}
                            >
                              + Keranjang
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="add-to-cart-btn disabled-btn"
                              disabled
                            >
                              Habis
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Detail Menu */}
      {selectedMenu && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content mm-card border-0 position-relative">
              <button
                type="button"
                className="btn-close mm-close"
                onClick={() => setSelectedMenu(null)}
                aria-label="Close"
              />
              <div className="row g-0">
                <div className="col-md-5 mm-visual position-relative">
                  <span className="mm-float f1"><i className="fa-solid fa-leaf"></i></span>
                  <span className="mm-float f2"><i className="fa-solid fa-pepper-hot"></i></span>
                  <span className="mm-float f3"><i className="fa-solid fa-lemon"></i></span>
                  <div className="mm-plate">
                    <img src={selectedMenu.gambar} alt={selectedMenu.nama_makanan} />
                  </div>
                  <span className="mm-cat">{selectedMenu.nama_kategori}</span>
                </div>

                <div className="col-md-7 mm-info p-4">
                  <p className="mm-eyebrow">Hidangan Nusantara</p>
                  <h3>{selectedMenu.nama_makanan}</h3>
                  <div className="mc-orn">
                    <span></span><i className="fa-solid fa-leaf"></i><span></span>
                  </div>
                  <p className="mm-desk">
                    {selectedMenu.deskripsi || 'Sajian lezat dengan bumbu khas rempah Timur Indonesia.'}
                  </p>

                  <div className="mm-spicy-box my-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="fw-bold">SPICY LEVEL</small>
                      <small>Level {selectedMenu.pedas}</small>
                    </div>
                    <div className="spicy">{renderChili(selectedMenu.pedas)}</div>
                  </div>

                  <div className="mm-foot d-flex justify-content-between align-items-center mt-4">
                    <div>
                      <small className="text-muted">Harga</small>
                      <div className="fs-5 fw-bold text-papeda">
                        Rp {selectedMenu.harga.toLocaleString('id-ID')}
                      </div>
                    </div>
                    {selectedMenu.status ? (
                      <button
                        type="button"
                        className="btn mm-order-btn"
                        onClick={() => {
                          onAddToCart?.(selectedMenu);
                          setSelectedMenu(null);
                        }}
                      >
                        Tambah ke Keranjang
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary" disabled>
                        Menu Habis
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
