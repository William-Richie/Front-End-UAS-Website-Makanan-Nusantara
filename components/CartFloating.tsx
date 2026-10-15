'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fab-container">
        <div
          className="fab fab-action d-flex justify-content-center align-items-center rounded-circle"
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
          <i className="fa-solid fa-cart-shopping cart-icon"></i>
          <span
            className={`cart-badge ${totalItems > 0 ? 'bump' : ''}`}
            id="cart-count"
            style={{ display: totalItems > 0 ? 'flex' : 'none' }}
          >
            {totalItems}
          </span>
        </div>

        {showScrollTop && (
          <div
            className="fab fab-up d-flex justify-content-center align-items-center rounded-circle"
            id="back-to-top"
            onClick={scrollToTop}
            role="button"
            tabIndex={0}
            title="Kembali ke atas"
            style={{ display: 'flex' }}
          >
            <i className="fa-solid fa-arrow-up"></i>
          </div>
        )}
      </div>

      {/* Cart Offcanvas Drawer */}
      {isOpen && (
        <>
          <div
            className="offcanvas-backdrop fade show"
            onClick={() => setIsOpen(false)}
          ></div>
          <div
            className="offcanvas offcanvas-end show"
            tabIndex={-1}
            id="cartSidebar"
            style={{ visibility: 'visible' }}
          >
            <div className="offcanvas-header bg-light border-bottom">
              <h5 className="offcanvas-title fw-bold" id="cartSidebarLabel">
                Keranjang Pesanan
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              />
            </div>

            <div className="offcanvas-body d-flex flex-column">
              <ul className="list-group list-group-flush mb-auto" id="cart-items-list">
                {items.length === 0 ? (
                  <li
                    className="list-group-item text-center text-muted border-0 mt-3"
                    id="empty-cart-msg"
                  >
                    Keranjang Anda masih kosong
                  </li>
                ) : (
                  items.map((item) => (
                    <li
                      key={item.id}
                      className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent"
                    >
                      <div className="d-flex align-items-center gap-2 me-2" style={{ minWidth: 0, flex: 1 }}>
                        {item.gambar && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.gambar} alt="" className="cart-item-thumb" />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div className="cart-item-title text-truncate" title={item.nama_makanan}>
                            {item.nama_makanan}
                          </div>
                          <div className="cart-item-price">
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
                          <button
                            type="button"
                            className="btn btn-qty-custom"
                            aria-label={`Kurangi ${item.nama_makanan}`}
                            onClick={() => onUpdateQuantity(item.id, -1)}
                          >
                            -
                          </button>
                          <span className="qty-number">{item.quantity}</span>
                          <button
                            type="button"
                            className="btn btn-qty-custom"
                            aria-label={`Tambah ${item.nama_makanan}`}
                            onClick={() => onUpdateQuantity(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn btn-delete-custom"
                          title="Hapus menu"
                          aria-label={`Hapus ${item.nama_makanan}`}
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                  <span>Total:</span>
                  <span id="cart-total-price">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn w-100 text-white"
                  id="btn-checkout-cart"
                  disabled={items.length === 0}
                  onClick={() => {
                    setIsOpen(false);
                    onCheckout();
                  }}
                >
                  Lanjut ke Pembayaran
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
