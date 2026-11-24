'use client';

import { useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import styles from './MyOrdersSection.module.css';
import { useNotify } from '@/components/Common/Notify/NotifyProvider';
import { bisaDibatalkanPelanggan } from '@/lib/orderOwner';

interface OrderApi {
  id: number;
  nama: string;
  item: string;
  total: number;
  status: string;
  status_bayar: string;
  created_at: string;
}

interface MenuLine {
  nama_makanan: string;
  harga: number;
  quantity: number;
}

interface MyOrdersSectionProps {
  onNotification?: (msg: string) => void;
  onResume?: (orderId: number) => void;
}

const STATUS_MAP: Record<string, [string, string]> = {
  menunggu_bayar: ['Menunggu Pembayaran', 'fa-hourglass-half'],
  pending: ['Pesanan Diterima', 'fa-bell-concierge'],
  diproses: ['Sedang Diproses', 'fa-fire-burner'],
  selesai: ['Selesai', 'fa-circle-check'],
  dibatalkan: ['Dibatalkan', 'fa-circle-xmark'],
};

const AKTIF = ['menunggu_bayar', 'pending', 'diproses'];
const REFRESH_MS = 8000;

const rupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const waktu = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

function bacaItem(raw: string) {
  try {
    const d = JSON.parse(raw);
    if (d && typeof d === 'object') {
      return {
        menu: Array.isArray(d.daftar_menu) ? (d.daftar_menu as MenuLine[]) : [],
        gerai: String(d.gerai || ''),
        antar: d.metode === 'online',
        alamat: d.metode === 'online' ? String(d.lokasi_atau_alamat || '') : '',
        bayar: String(d.metode_bayar || ''),
        ongkir: Number(d.ongkir || 0),
      };
    }
  } catch {}
  return { menu: [], gerai: '', antar: false, alamat: '', bayar: '', ongkir: 0 };
}

function ringkasMenu(menu: MenuLine[]) {
  if (menu.length === 0) return '';
  const awal = menu.slice(0, 2).map((m) => `${m.nama_makanan} x${m.quantity}`).join(', ');
  return menu.length > 2 ? `${awal}, +${menu.length - 2} lainnya` : awal;
}

export default function MyOrdersSection({ onNotification, onResume }: MyOrdersSectionProps) {
  const notify = useNotify();
  const [list, setList] = useState<OrderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'berjalan' | 'riwayat'>('berjalan');
  const [terpilihId, setTerpilihId] = useState<number | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const muat = useCallback(async () => {
    try {
      const res = await fetch('/api/pesanan/mine', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      setList(Array.isArray(json?.data) ? json.data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(muat, 0);
    const timer = setInterval(muat, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [muat]);

  const handleCancel = async (o: OrderApi) => {
    const yakin = await notify.confirm({
      title: 'Batalkan Pesanan?',
      message: `Pesanan #${o.id} akan dibatalkan.`,
      confirmText: 'Ya, Batalkan',
      cancelText: 'Kembali',
      danger: true,
    });
    if (!yakin) return;
    setSibuk(true);
    try {
      const res = await fetch(`/api/pesanan/${o.id}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal membatalkan pesanan.');
      onNotification?.(`Pesanan #${o.id} dibatalkan.`);
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Gagal membatalkan pesanan.');
    } finally {
      setSibuk(false);
      muat();
    }
  };

  const berjalan = list.filter((o) => AKTIF.includes(o.status));
  const riwayat = list.filter((o) => !AKTIF.includes(o.status));
  const tampil = tab === 'berjalan' ? berjalan : riwayat;
  const terpilih = terpilihId === null ? null : list.find((o) => o.id === terpilihId) || null;
  const info = terpilih ? bacaItem(terpilih.item) : null;
  const status = terpilih ? STATUS_MAP[terpilih.status] || [terpilih.status, 'fa-circle-question'] : null;
  const bisaBatal = terpilih ? bisaDibatalkanPelanggan(terpilih.status, terpilih.item) : false;
  const lunas = terpilih?.status_bayar === 'Lunas';

  return (
    <section id="my-orders" className="page-section">
      <div className="hero-banner sec-hero">
        <div className="sec-hero-bg" aria-hidden="true">
          <span className="sec-rings"></span>
          <span className="sec-float f1"><i className="fa-solid fa-leaf"></i></span>
          <span className="sec-float f2"><i className="fa-solid fa-receipt"></i></span>
          <span className="sec-float f3"><i className="fa-solid fa-utensils"></i></span>
        </div>
        <div className="container text-center position-relative">
          <p className="hero-eyebrow reveal">Riwayat Anda</p>
          <h1 className="sec-title reveal reveal-d1">
            Order<br /><em>History</em>
          </h1>
          <ul className="loc-chips reveal reveal-d2">
            <li><i className="fa-solid fa-hourglass-half"></i>Pantau Status</li>
            <li><i className="fa-solid fa-rotate-left"></i>Bisa Dibatalkan</li>
          </ul>
        </div>
      </div>

      <div className="content-container container py-4" style={{ maxWidth: '850px' }}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'berjalan'}
            className={`${styles.tab} ${tab === 'berjalan' ? styles.tabActive : ''}`}
            onClick={() => setTab('berjalan')}
          >
            On Going<span className={styles.tabCount}>{berjalan.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'riwayat'}
            className={`${styles.tab} ${tab === 'riwayat' ? styles.tabActive : ''}`}
            onClick={() => setTab('riwayat')}
          >
            History<span className={styles.tabCount}>{riwayat.length}</span>
          </button>
        </div>

        {loading ? (
          <p className="text-center py-4">Memuat pesanan...</p>
        ) : tampil.length === 0 ? (
          <div className="text-center py-4">
            <div className={`${styles.emptyIcon} mb-2`}>
              <i className="fa-solid fa-receipt"></i>
            </div>
            <p className="text-muted">
              {tab === 'berjalan' ? 'Tidak ada pesanan yang sedang berjalan.' : 'Belum ada riwayat pesanan.'}
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {tampil.map((o) => {
              const it = bacaItem(o.item);
              const s = STATUS_MAP[o.status] || [o.status, 'fa-circle-question'];
              return (
                <button
                  key={o.id}
                  type="button"
                  className={styles.row}
                  onClick={() => setTerpilihId(o.id)}
                  aria-label={`Lihat rincian pesanan #${o.id}`}
                >
                  <span className={styles.rowIcon}>
                    <i className={`fa-solid ${it.antar ? 'fa-motorcycle' : 'fa-utensils'}`}></i>
                  </span>
                  <span className={styles.rowMain}>
                    <span className={styles.rowTitle}>
                      Pesanan #{o.id} · {waktu(o.created_at)}
                    </span>
                    <span className={styles.rowSub}>{ringkasMenu(it.menu) || it.gerai}</span>
                  </span>
                  <span className={styles.rowRight}>
                    <span className={`${styles.badge} ${styles[o.status] || ''}`}>
                      <i className={`fa-solid ${s[1]} me-1`}></i>
                      {s[0]}
                    </span>
                    <span className={styles.rowTotal}>{rupiah(o.total)}</span>
                  </span>
                  <i className={`fa-solid fa-chevron-right ${styles.rowArrow}`}></i>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pop up rincian pesanan */}
      <Modal
        show={!!terpilih}
        onHide={() => setTerpilihId(null)}
        centered
        scrollable
        contentClassName={styles.modalContent}
      >
        {terpilih && info && status && (
          <>
            <Modal.Header closeButton className={styles.modalHead}>
              <span className={styles.modalIcon}>
                <i className={`fa-solid ${info.antar ? 'fa-motorcycle' : 'fa-receipt'}`}></i>
              </span>
              <div className={styles.modalHeadText}>
                <Modal.Title className={styles.modalTitle}>Pesanan #{terpilih.id}</Modal.Title>
                <small>{waktu(terpilih.created_at)}</small>
              </div>
            </Modal.Header>

            <Modal.Body className={styles.modalBody}>
              <div className={`${styles.statusBanner} ${styles[`banner_${terpilih.status}`] || ''}`}>
                <i className={`fa-solid ${status[1]}`}></i>
                <span>{status[0]}</span>
              </div>

              <ul className={styles.infoList}>
                <li>
                  <span className={styles.infoLabel}>
                    <i className={`fa-solid ${info.antar ? 'fa-motorcycle' : 'fa-utensils'}`}></i>Metode
                  </span>
                  <span className={styles.infoValue}>{info.antar ? 'Pesan Antar' : 'Makan di Tempat'}</span>
                </li>
                {info.gerai && (
                  <li>
                    <span className={styles.infoLabel}><i className="fa-solid fa-store"></i>Gerai</span>
                    <span className={styles.infoValue}>{info.gerai}</span>
                  </li>
                )}
                {info.alamat && (
                  <li>
                    <span className={styles.infoLabel}><i className="fa-solid fa-location-dot"></i>Alamat</span>
                    <span className={styles.infoValue}>{info.alamat}</span>
                  </li>
                )}
                {info.bayar && (
                  <li>
                    <span className={styles.infoLabel}><i className="fa-solid fa-wallet"></i>Pembayaran</span>
                    <span className={styles.infoValue}>{info.bayar}</span>
                  </li>
                )}
                <li>
                  <span className={styles.infoLabel}>
                    <i className={`fa-solid ${lunas ? 'fa-circle-check' : 'fa-clock'}`}></i>Status bayar
                  </span>
                  <span className={`${styles.payPill} ${lunas ? styles.payPillLunas : styles.payPillBelum}`}>
                    {lunas ? 'Lunas' : 'Belum dibayar'}
                  </span>
                </li>
              </ul>

              {info.menu.length > 0 && (
                <>
                  <p className={styles.sectionLabel}>Menu dipesan</p>
                  <ul className={styles.items}>
                    {info.menu.map((m, i) => (
                      <li key={i}>
                        <span className={styles.qty}>{m.quantity}x</span>
                        <span className={styles.itemName}>
                          {m.nama_makanan}
                          <small>{rupiah(m.harga)} / porsi</small>
                        </span>
                        <b>{rupiah(m.harga * m.quantity)}</b>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className={styles.summary}>
                <div className={styles.sumRow}>
                  <span>Subtotal</span>
                  <span>{rupiah(terpilih.total - info.ongkir)}</span>
                </div>
                {info.ongkir > 0 && (
                  <div className={styles.sumRow}>
                    <span>Ongkos kirim</span>
                    <span>{rupiah(info.ongkir)}</span>
                  </div>
                )}
                <div className={styles.sumTotal}>
                  <span>Total</span>
                  <span>{rupiah(terpilih.total)}</span>
                </div>
              </div>

              {!bisaBatal && AKTIF.includes(terpilih.status) && (
                <div className={styles.note}>
                  <i className="fa-solid fa-circle-info"></i>
                  {terpilih.status === 'diproses'
                    ? 'Pesanan sedang diproses dapur dan tidak bisa dibatalkan. Hubungi gerai jika ada kendala.'
                    : 'Pesanan sudah dibayar. Hubungi gerai jika ingin membatalkan.'}
                </div>
              )}
            </Modal.Body>

            {(terpilih.status === 'menunggu_bayar' || bisaBatal) && (
              <Modal.Footer className={styles.modalFoot}>
                {terpilih.status === 'menunggu_bayar' && (
                  <button
                    type="button"
                    className={`btn ${styles.payBtn}`}
                    onClick={() => {
                      setTerpilihId(null);
                      onResume?.(terpilih.id);
                    }}
                  >
                    <i className="fa-solid fa-cash-register me-2"></i>Lanjut Bayar
                  </button>
                )}
                {bisaBatal && (
                  <button
                    type="button"
                    className={`btn ${styles.cancelBtn}`}
                    disabled={sibuk}
                    onClick={() => handleCancel(terpilih)}
                  >
                    {sibuk ? 'Membatalkan…' : 'Batalkan Pesanan'}
                  </button>
                )}
              </Modal.Footer>
            )}
          </>
        )}
      </Modal>
    </section>
  );
}
