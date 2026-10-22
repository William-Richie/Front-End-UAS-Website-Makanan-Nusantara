'use client';

import Image from 'next/image';
import { Container, Modal, Row, Col, Button } from 'react-bootstrap';
import styles from './MenuSection.module.css';
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
  onAddToCart?: (menu: MenuItem, qty?: number) => void;
}

const URUTAN_KATEGORI = ['APPETIZER', 'MAIN COURSE', 'DESSERT', 'MINUMAN', 'DRINK', 'ADDITIONAL'];
const LABEL_PEDAS = ['Tidak Pedas', 'Mild', 'Mild', 'Medium', 'Hot', 'Extra Hot'];
const MAX_QTY = 20;

function clampPedas(level: number) {
  return Math.max(0, Math.min(5, Math.round(level || 0)));
}

function Chili({ level }: { level: number }) {
  const l = clampPedas(level);
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={`fa-solid fa-pepper-hot ${i <= l ? styles.on : ''}`}
          style={{ '--i': i } as React.CSSProperties}
        />
      ))}
    </>
  );
}

export default function MenuSection({ menus = [], onAddToCart }: MenuSectionProps) {
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
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

  const openDetail = (menu: MenuItem) => {
      setModalQty(1);
      setModalVisible(false);
      setSelectedMenu(menu);
      setModalVisible(true);
  };

  const closeDetail = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedMenu(null), 300);
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

          <Container className="text-center position-relative">
            <p className="hero-eyebrow reveal">Cita Rasa Timur Nusantara</p>
            <h1 className="sec-title reveal reveal-d1">
              Taste Our Papeda<br /><em>Menu&apos;s</em>
            </h1>
            <ul className="loc-chips reveal reveal-d2">
              <li><i className="fa-solid fa-utensils"></i>{categories.length} Kategori Menu</li>
              <li><i className="fa-solid fa-pepper-hot"></i>Rempah Pilihan</li>
            </ul>
          </Container>
        </div>

        <div className="content-container" id="tempat-menu-dinamis">
          {menus.length === 0 ? (
            <p className="text-center py-4">Memuat menu restoran...</p>
          ) : (
            <>
              {/* Tabs Kategori */}
              <div className={styles.menuTabs}>
                {categories.map((kat) => (
                  <button
                    key={kat}
                    type="button"
                    className={`${styles.menuTab} ${activeTab === kat ? styles.active : ''}`}
                    onClick={() => setCurrentTab(kat)}
                  >
                    {kat}
                  </button>
                ))}
              </div>

              {/* Grid menu per kategori */}
              {categories.map((kat) => (
                <div key={kat} className={`${styles.menuGroup} ${activeTab === kat ? styles.active : ''}`}>
                  <div className={styles.categoryHeader}>{kat}</div>
                  <div className={styles.menuGrid}>
                    {grouped[kat].map((makanan) => {
                      const tersedia = makanan.status === true;
                      const pedas = clampPedas(makanan.pedas);
                      return (
                        <div
                          key={makanan.id}
                          className={`${styles.menuCard} reveal ${tersedia ? '' : styles.menuKosong}`}
                          onClick={() => openDetail(makanan)}
                        >
                          {!tersedia && <div className={styles.badgeKosong}>Tidak Tersedia</div>}
                          <div
                            className={styles.photo}
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
                            <Image
                              src={makanan.gambar}
                              alt={makanan.nama_makanan}
                              width={600}
                              height={400}
                              sizes="(max-width: 767px) 50vw, 300px"
                              className={styles.menuImg}
                              loading="lazy"
                            />

                            {pedas > 0 && (
                              <div className={`${styles.spicyBadge} ${styles.spicy}`} title={LABEL_PEDAS[pedas]}>
                                <Chili level={pedas} />
                              </div>
                            )}
                            <span className={styles.cardOpen}>
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </span>
                            <span className={styles.detailChip}>
                              <i className="fa-regular fa-eye"></i> Lihat Detail
                            </span>
                          </div>

                          <div className={styles.body}>
                            <div className={styles.dishName}>{makanan.nama_makanan}</div>
                            <div className="mc-orn">
                              <span></span>
                              <i className="fa-solid fa-leaf"></i>
                              <span></span>
                            </div>
                            {makanan.deskripsi && <p className={styles.desc}>{makanan.deskripsi}</p>}
                            <div className={styles.details}>
                              <div className={styles.price}>{harga(makanan.harga)}</div>
                              {tersedia ? (
                                <button
                                  type="button"
                                  className={`${styles.addBtn} ${justAddedId === makanan.id ? styles.added : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(makanan);
                                  }}
                                >
                                  {justAddedId === makanan.id ? 'Berhasil!' : '+ Keranjang'}
                                </button>
                              ) : (
                                <button type="button" className={`${styles.addBtn} ${styles.disabledBtn}`} disabled>
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
      <Modal
        show={modalVisible}
        onHide={closeDetail}
        centered
        size="lg"
        contentClassName={`${styles.modalCard} border-0`}
      >
        <button
          type="button"
          className={`btn-close ${styles.modalClose}`}
          onClick={closeDetail}
          aria-label="Close"
        />
        <Row className="g-0 w-100 h-100">
          <Col md={5} className={`${styles.visual} position-relative overflow-hidden d-flex align-items-center justify-content-center`}>
            <span className={`${styles.mmFloat} ${styles.f1}`}><i className="fa-solid fa-leaf"></i></span>
            <span className={`${styles.mmFloat} ${styles.f2}`}><i className="fa-solid fa-pepper-hot"></i></span>
            <span className={`${styles.mmFloat} ${styles.f3}`}><i className="fa-solid fa-lemon"></i></span>
            <div className={styles.plate}>
              {selectedMenu && (
                <Image
                  src={selectedMenu.gambar}
                  alt={selectedMenu.nama_makanan}
                  width={600}
                  height={600}
                  sizes="(max-width: 767px) 80vw, 500px"
                  className={styles.plateImg}
                />
              )}
            </div>
            <span className={`${styles.catTag} position-absolute`}>{selectedMenu?.nama_kategori}</span>
          </Col>

          <Col md={7} className="p-4 p-md-5 d-flex flex-column justify-content-center">
            <p className="text-uppercase fw-bold text-muted small mb-1">Hidangan Nusantara</p>
            <h3 className="fw-bold mb-2">{selectedMenu?.nama_makanan}</h3>
            <div className="mc-orn mb-3">
              <span></span><i className="fa-solid fa-leaf"></i><span></span>
            </div>
            <p className={`${styles.desk} text-muted mb-4`}>{selectedMenu?.deskripsi || 'Deskripsi belum tersedia.'}</p>

            {selectedMenu && (
              <div className={`${styles.spicyBox} mb-4`}>
                <div className="d-flex justify-content-between">
                  <small className="fw-bold">SPICY LEVEL</small>
                  <small>{LABEL_PEDAS[clampPedas(selectedMenu.pedas)]}</small>
                </div>
                <div className={styles.spicy}>
                  <Chili level={selectedMenu.pedas} />
                </div>
              </div>
            )}

            <div className={`${styles.foot} mt-auto border-top pt-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3`}>
              <div>
                <small className="text-muted d-block">Harga</small>
                <div id="mm-harga" className="fw-bold fs-5 text-papeda">
                  {selectedMenu && harga(selectedMenu.harga)}
                </div>
              </div>
              
              {selectedTersedia ? (
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center border rounded p-1" aria-label="Jumlah porsi">
                    <Button
                      variant="light"
                      className={`${styles.qtyBtn} border-0 py-0`}
                      aria-label="Kurangi"
                      disabled={modalQty <= 1}
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                    >
                      -
                    </Button>
                    <span className={`${styles.qtyNumber} px-3 fw-bold`}>{modalQty}</span>
                    <Button
                      variant="light"
                      className={`${styles.qtyBtn} border-0 py-0`}
                      aria-label="Tambah"
                      disabled={modalQty >= MAX_QTY}
                      onClick={() => setModalQty((q) => Math.min(MAX_QTY, q + 1))}
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    variant="papeda"
                    className={`${styles.orderBtn} d-flex align-items-center`}
                    onClick={() => {
                      if (selectedMenu) addToCart(selectedMenu, modalQty);
                      closeDetail();
                    }}
                  >
                    <i className="fa-solid fa-bag-shopping me-2"></i>
                    Tambah
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" className={styles.orderBtn} disabled>
                  Habis
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Modal>
    </>
  );
}