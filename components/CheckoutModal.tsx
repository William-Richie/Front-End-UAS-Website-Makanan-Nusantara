'use client';

import { useState } from 'react';
import { CartItem } from './CartFloating';
import { BranchMap } from './ReservationSection';

interface CheckoutModalProps {
  show: boolean;
  cartItems: CartItem[];
  branches: BranchMap[];
  userName?: string;
  onClose: () => void;
  onSuccess: (orderId: number) => void;
}

export default function CheckoutModal({
  show,
  cartItems,
  branches,
  userName = 'Pelanggan',
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [orderType, setOrderType] = useState<'dine-in' | 'online'>('dine-in');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!show) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.harga * item.quantity, 0);
  const ongkir = orderType === 'online' ? 15000 : 0;
  const totalBayar = subtotal + ongkir;

  const handleConfirmPay = async () => {
    if (orderType === 'dine-in' && !selectedBranch) {
      setErrorMsg('Pilih gerai restoran terlebih dahulu.');
      return;
    }
    if (orderType === 'online' && !deliveryAddress.trim()) {
      setErrorMsg('Masukkan alamat pengiriman Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const orderPayload = {
        nama: userName || 'Pelanggan',
        item: JSON.stringify({
          metode: orderType,
          lokasi_atau_alamat: orderType === 'dine-in' ? selectedBranch : deliveryAddress,
          daftar_menu: cartItems,
          ongkir,
        }),
        total: totalBayar,
        status: 'pending',
      };

      const res = await fetch('/api/pesanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses pesanan.');

      onSuccess(data.pesanan?.id || 1);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses pembayaran.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header checkout-header">
            <div className="d-flex align-items-center gap-2">
              <div className="gate-icon">
                <i className="fa-solid fa-receipt"></i>
              </div>
              <h5 className="modal-title fw-bold" id="checkoutModalLabel">
                Konfirmasi Pesanan
              </h5>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body checkout-body">
            <div className="mb-4 text-center">
              <p className="fw-bold mb-2 checkout-order-type-title">
                Pilih metode pesanan Anda:
              </p>
              <div className="checkout-type-group w-100 d-flex gap-2" role="group">
                <button
                  type="button"
                  className={`btn checkout-type-btn flex-fill ${orderType === 'dine-in' ? 'active btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setOrderType('dine-in')}
                >
                  <i className="fa-solid fa-store me-1"></i> Makan di Tempat
                </button>
                <button
                  type="button"
                  className={`btn checkout-type-btn flex-fill ${orderType === 'online' ? 'active btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setOrderType('online')}
                >
                  <i className="fa-solid fa-motorcycle me-1"></i> Pesan Antar
                </button>
              </div>
            </div>

            {orderType === 'dine-in' ? (
              <div id="dineInForm" className="mb-3">
                <label htmlFor="checkout-store" className="form-label fw-bold small text-uppercase checkout-form-label">
                  Pilih Gerai Restoran
                </label>
                <select
                  id="checkout-store"
                  className="form-select custom-input"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="" disabled>-- Pilih Lokasi --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.nama}>
                      {b.nama} - {b.alamat}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div id="onlineForm" className="mb-3">
                <label htmlFor="delivery-address" className="form-label fw-bold small text-uppercase checkout-form-label">
                  Alamat Pengiriman
                </label>
                <textarea
                  id="delivery-address"
                  className="form-control custom-input"
                  rows={3}
                  placeholder="Masukkan alamat lengkap Anda..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}

            <div className="checkout-summary p-3 bg-light rounded mt-3">
              <div className="summary-row d-flex justify-content-between mb-1">
                <span>Subtotal Makanan</span>
                <span id="modalSubtotal" className="fw-bold">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              {orderType === 'online' && (
                <div className="summary-row text-danger d-flex justify-content-between mb-1">
                  <span>Ongkos Kirim</span>
                  <span id="modalOngkir" className="fw-bold">
                    + Rp {ongkir.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <hr />
              <div className="summary-total d-flex justify-content-between fs-5 fw-bold">
                <span>Total Bayar</span>
                <span id="modalTotalBayar" className="text-papeda">
                  Rp {totalBayar.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {errorMsg && <div className="alert alert-danger py-2 small mt-3">{errorMsg}</div>}
          </div>

          <div className="modal-footer border-0 pb-4 px-4 pt-0">
            <button
              type="button"
              className="btn btn-papeda w-100 text-white fw-bold py-2"
              disabled={loading || cartItems.length === 0}
              onClick={handleConfirmPay}
            >
              {loading ? (
                'Memproses...'
              ) : (
                <>
                  Konfirmasi & Bayar <i className="fa-solid fa-arrow-right ms-2"></i>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
