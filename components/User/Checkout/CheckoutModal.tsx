'use client';

import { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { CartItem } from '../FloatingButton/FloatingButton';
import { BranchMap } from '../Reservation/ReservationSection';
import styles from './CheckoutModal.module.css';

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
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      className={styles.checkoutModal}
      backdropClassName={styles.checkoutBackdrop}
      contentClassName={styles.checkoutContent}
    >
      <Modal.Header closeButton className={styles.checkoutHeader}>
        <Modal.Title className={`${styles.checkoutTitle} fw-bold d-flex align-items-center gap-2`}>
          <div className={styles.gateIcon}>
            <i className="fa-solid fa-receipt"></i>
          </div>
          Konfirmasi Pesanan
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className={styles.checkoutBody}>
        <div className="mb-4 text-center">
          <p className={`fw-bold mb-2 ${styles.checkoutOrderTypeTitle}`}>
            Pilih metode pesanan Anda:
          </p>
          <div className={`${styles.checkoutTypeGroup} w-100 d-flex gap-2`} role="group">
            <Button
              variant="outline-secondary"
              active={orderType === 'dine-in'}
              className={`${styles.checkoutTypeBtn} flex-fill`}
              onClick={() => setOrderType('dine-in')}
            >
              <i className="fa-solid fa-store me-1"></i> Makan di Tempat
            </Button>
            <Button
              variant="outline-secondary"
              active={orderType === 'online'}
              className={`${styles.checkoutTypeBtn} flex-fill`}
              onClick={() => setOrderType('online')}
            >
              <i className="fa-solid fa-motorcycle me-1"></i> Pesan Antar
            </Button>
          </div>
        </div>

        {orderType === 'dine-in' ? (
          <Form.Group className="mb-3" controlId="dineInForm">
            <Form.Label className={`fw-bold small text-uppercase ${styles.checkoutFormLabel}`}>
              Pilih Gerai Restoran
            </Form.Label>
            <Form.Select
              className={styles.customInput}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="" disabled>-- Pilih Lokasi --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.nama}>
                  {b.nama} - {b.alamat}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        ) : (
          <Form.Group className="mb-3" controlId="onlineForm">
            <Form.Label className={`fw-bold small text-uppercase ${styles.checkoutFormLabel}`}>
              Alamat Pengiriman
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className={styles.customInput}
              placeholder="Masukkan alamat lengkap Anda..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </Form.Group>
        )}

        <div className={styles.checkoutSummary}>
          <div className={`${styles.summaryRow} d-flex justify-content-between mb-1`}>
            <span>Subtotal Makanan</span>
            <span id="modalSubtotal" className="fw-bold">
              Rp {subtotal.toLocaleString('id-ID')}
            </span>
          </div>
          {orderType === 'online' && (
            <div className={`${styles.summaryRow} ${styles.summaryOngkir} d-flex justify-content-between mb-1`}>
              <span>Ongkos Kirim</span>
              <span id="modalOngkir" className="fw-bold">
                + Rp {ongkir.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <hr />
          <div className={`${styles.summaryTotal} d-flex justify-content-between fs-5 fw-bold`}>
            <span>Total Bayar</span>
            <span id="modalTotalBayar" className="text-papeda">
              Rp {totalBayar.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {errorMsg && <div className={styles.checkoutError} role="alert">{errorMsg}</div>}
      </Modal.Body>

      <Modal.Footer className={styles.checkoutFooter}>
        <Button
          variant="papeda"
          className="w-100 text-white fw-bold py-2"
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
        </Button>
      </Modal.Footer>
    </Modal>
  );
}