'use client';

import { useState, useMemo, useEffect } from 'react';

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
  onAddToCart?: (menu: MenuItem, qty?: number) => void;
}

const URUTAN_KATEGORI = ['APPETIZER', 'MAIN COURSE', 'DESSERT', 'MINUMAN', 'DRINK', 'ADDITIONAL'];
const LABEL_PEDAS = ['Tidak Pedas', 'Mild', 'Mild', 'Medium', 'Hot', 'Extra Hot'];
const MAX_QTY = 20;

function clampPedas(level: number) {
  return Math.max(0, Math.min(5, Math.round(level || 0)));
}

/** 5 cabai; sejumlah level "menyala" (class .on dipakai CSS untuk warna & animasi) */
function Chili({ level }: { level: number }) {
  const l = clampPedas(level);
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={`fa-solid fa-pepper-hot ${i <= l ? 'on' : ''}`}
          style={{ '--i': i } as React.CSSProperties}
        />
      ))}
    </>
  );
}

export default function MenuSection({ menus = [], onAddToCart }: MenuSectionProps) {
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [currentTab, setCurrentTab] = useState('');
  const [justAddedId, setJustAddedId] = useState<number | null>(null);

  const { grouped, categories } = useMemo(() => {
    const groupedData: Record<string, MenuItem[]> = {};
    menus.forEach((item) => {
      const kat = (item.nama_kategori || 'LAINNYA').trim();
      (groupedData[kat] ||= []).push(item);
    });
    const getOrder = (k: string) => {
      const idx = URUTAN_KATEGORI.indexOf(k.toUpperCase());
      return idx === -1 ? 99 : idx;
    };
    const sortedCats = Object.keys(groupedData).sort((a, b) => getOrder(a) - getOrder(b));
    return { grouped: groupedData, categories: sortedCats };
  }, [menus]);

  const activeTab = categories.includes(currentTab) ? currentTab : categories[0] || '';

  useEffect(() => {
    if (!selectedMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedMenu(null);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedMenu]);

  const openDetail = (menu: MenuItem) => {
    setModalQty(1);
    setSelectedMenu(menu);
  };

  const addToCart = (menu: MenuItem, qty = 1) => {
    onAddToCart?.(menu, qty);
    setJustAddedId(menu.id);
    setTimeout(() => setJustAddedId((cur) => (cur === menu.id ? null : cur)), 1000);
  };

  const harga = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const selectedTersedia = selectedMenu?.status === true;

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
          {menus.length === 0 ? (
            <p className="text-center py-4">Memuat menu restoran...</p>
          ) : (
            <>
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

              {/* Grid menu per kategori */}
              {categories.map((kat) => (
                <div key={kat} className={`menu-group ${activeTab === kat ? 'active' : ''}`}>
                  <div className="category-header">{kat}</div>
                  <div className="menu-grid">
                    {grouped[kat].map((makanan) => {
                      const tersedia = makanan.status === true;
                      const pedas = clampPedas(makanan.pedas);
                      return (
                        <div
                          key={makanan.id}
                          className={`menu-item menu-card reveal ${tersedia ? '' : 'menu-kosong'}`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.add-to-cart-btn')) return;
                            openDetail(makanan);
                          }}
                        >
                          {!tersedia && <div className="status-badge-kosong">Tidak Tersedia</div>}
                          <div
                            className="mc-photo"
                            role="button"
                            tabIndex={0}
                            aria-label={`Lihat detail ${makanan.nama_makanan}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openDetail(makanan);
                              }
                            }}
                          >
                            <img
                              src={makanan.gambar}
                              alt={makanan.nama_makanan}
                              className="menu-img"
                              loading="lazy"
                            />
                            {pedas > 0 && (
                              <div className="mc-spicy spicy" title={LABEL_PEDAS[pedas]}>
                                <Chili level={pedas} />
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
                            {makanan.deskripsi && <p className="mc-desc">{makanan.deskripsi}</p>}
                            <div className="menu-details">
                              <div className="menu-price">{harga(makanan.harga)}</div>
                              {tersedia ? (
                                <button
                                  type="button"
                                  className="add-to-cart-btn"
                                  style={
                                    justAddedId === makanan.id
                                      ? { backgroundColor: '#27ae60', color: 'white' }
                                      : undefined
                                  }
                                  onClick={() => addToCart(makanan)}
                                >
                                  {justAddedId === makanan.id ? 'Berhasil!' : '+ Keranjang'}
                                </button>
                              ) : (
                                <button type="button" className="add-to-cart-btn disabled-btn" disabled>
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
            </>
          )}
        </div>
      </section>

      {/* Modal Detail Menu */}
      {selectedMenu && (
        <div
          id="menuModal"
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={`Detail ${selectedMenu.nama_makanan}`}
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMenu(null);
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content mm-card border-0">
              <button
                type="button"
                className="btn-close mm-close"
                onClick={() => setSelectedMenu(null)}
                aria-label="Close"
              />
              <div className="row g-0">
                <div className="col-md-5 mm-visual">
                  <span className="mm-float f1"><i className="fa-solid fa-leaf"></i></span>
                  <span className="mm-float f2"><i className="fa-solid fa-pepper-hot"></i></span>
                  <span className="mm-float f3"><i className="fa-solid fa-lemon"></i></span>
                  <div className="mm-plate">
                    <img src={selectedMenu.gambar} alt={selectedMenu.nama_makanan} />
                  </div>
                  <span className="mm-cat">{selectedMenu.nama_kategori}</span>
                </div>

                <div className="col-md-7 mm-info">
                  <p className="mm-eyebrow">Hidangan Nusantara</p>
                  <h3>{selectedMenu.nama_makanan}</h3>
                  <div className="mc-orn">
                    <span></span><i className="fa-solid fa-leaf"></i><span></span>
                  </div>
                  <p className="mm-desk">{selectedMenu.deskripsi || 'Deskripsi belum tersedia.'}</p>

                  <div className="mm-spicy-box">
                    <div className="d-flex justify-content-between">
                      <small>SPICY LEVEL</small>
                      <small>{LABEL_PEDAS[clampPedas(selectedMenu.pedas)]}</small>
                    </div>
                    <div className="spicy">
                      <Chili level={selectedMenu.pedas} />
                    </div>
                  </div>

                  <div className="mm-foot">
                    <div>
                      <small>Harga</small>
                      <div id="mm-harga">{harga(selectedMenu.harga)}</div>
                    </div>
                    {selectedTersedia ? (
                      <div className="d-flex align-items-center gap-3 flex-wrap">
                        <div className="d-flex align-items-center" aria-label="Jumlah porsi">
                          <button
                            type="button"
                            className="btn btn-qty-custom"
                            aria-label="Kurangi"
                            disabled={modalQty <= 1}
                            onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                          >
                            -
                          </button>
                          <span className="qty-number">{modalQty}</span>
                          <button
                            type="button"
                            className="btn btn-qty-custom"
                            aria-label="Tambah"
                            disabled={modalQty >= MAX_QTY}
                            onClick={() => setModalQty((q) => Math.min(MAX_QTY, q + 1))}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn mm-order-btn"
                          onClick={() => {
                            addToCart(selectedMenu, modalQty);
                            setSelectedMenu(null);
                          }}
                        >
                          <i className="fa-solid fa-bag-shopping me-2"></i>
                          Tambah &middot; {harga(selectedMenu.harga * modalQty)}
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="btn mm-order-btn" disabled>
                        Habis
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
