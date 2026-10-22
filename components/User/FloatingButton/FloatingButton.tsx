'use client';

import { useState, useEffect } from 'react';
import { Offcanvas, ListGroup, Button } from 'react-bootstrap';
import Image from "next/image";
import styles from './FloatingButton.module.css';

export interface CartItem {
  id: number;
  nama_makanan: string;
  harga: number;
  quantity: number;
  gambar?: string;
}

interface CartDrawerProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export default function CartFloating({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.harga * item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className={styles.fabContainer}>
        <div
          className={`fab ${styles.fabAction} d-flex justify-content-center align-items-center rounded-circle`}
          id="cart-button"
          onClick={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Buka keranjang pesanan"
          title="Keranjang Pesanan"
        >
          <i className={`fa-solid fa-cart-shopping ${styles.cartIcon}`}></i>
          <span
            key={totalItems}
            className={`${styles.cartBadge} ${totalItems > 0 ? styles.bump : ''}`}
            id="cart-count"
            style={{ display: totalItems > 0 ? 'flex' : 'none' }}
          >
            {totalItems}
          </span>
        </div>

        {showScrollTop && (
          <div
            className={`fab ${styles.fabAction} d-flex justify-content-center align-items-center rounded-circle`}
            id="back-to-top"
            onClick={scrollToTop}
            role="button"
            tabIndex={0}
            title="Kembali ke atas"
            style={{ display: 'flex' }}
          >
            <i className="fa-solid fa-arrow-up ${styles.upIcon}"></i>
          </div>
        )}
      </div>

      <Offcanvas
        className={styles.cartDrawer}
        show={isOpen} 
        onHide={() => setIsOpen(false)} 
        placement="end" 
        id="cartSidebar"
      >
        <Offcanvas.Header closeButton className={styles.cartHeader}>
          <Offcanvas.Title className={`${styles.cartTitle} fw-bold`} id="cartSidebarLabel">
            Keranjang Pesanan
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column">
          <ListGroup variant="flush" className={`${styles.cartItemsList} mb-auto`}>
            {items.length === 0 ? (
              <ListGroup.Item
                className={`${styles.listGroupItem} ${styles.emptyMsg} text-center border-0 mt-3`}
                id="empty-cart-msg"
              >
                Keranjang Anda masih kosong
              </ListGroup.Item>
            ) : (
              items.map((item) => (
                <ListGroup.Item
                  key={item.id}
                  className={`${styles.listGroupItem} d-flex justify-content-between align-items-center px-0 py-3 bg-transparent border-bottom`}
                >
                  <div className="d-flex align-items-center gap-2 me-2" style={{ minWidth: 0, flex: 1 }}>
                    {item.gambar && (
                      <Image
                        src={item.gambar}
                        alt=""
                        width={46}
                        height={46}
                        unoptimized
                        className={styles.cartItemThumb}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className={`${styles.cartItemTitle} text-truncate`} title={item.nama_makanan}>
                        {item.nama_makanan}
                      </div>
                      <div className={styles.cartItemPrice}>
                        Rp {(item.harga * item.quantity).toLocaleString('id-ID')}
                        {item.quantity > 1 && (
                          <small className="text-muted ms-1">
                            ({item.quantity} x {item.harga.toLocaleString('id-ID')})
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center">
                      <Button
                        variant="light"
                        className={styles.btnQtyCustom}
                        aria-label={`Kurangi ${item.nama_makanan}`}
                        onClick={() => onUpdateQuantity(item.id, -1)}
                      >
                        -
                      </Button>
                      <span className={styles.qtyNumber}>{item.quantity}</span>
                      <Button
                        variant="light"
                        className={styles.btnQtyCustom}
                        aria-label={`Tambah ${item.nama_makanan}`}
                        onClick={() => onUpdateQuantity(item.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      className={`text-danger ${styles.btnDeleteCustom}`}
                      title="Hapus menu"
                      aria-label={`Hapus ${item.nama_makanan}`}
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </Button>
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>

          <div className={`${styles.cartFooter} mt-4 pt-3`}>
            <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
              <span>Total:</span>
              <span className={styles.cartTotalPrice}>
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
            <Button
              variant="papeda"
              className={`${styles.btnCheckoutCart} w-100 text-white`}
              disabled={items.length === 0}
              onClick={() => {
                setIsOpen(false);
                onCheckout();
              }}
            >
              Lanjut ke Pembayaran
            </Button>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}