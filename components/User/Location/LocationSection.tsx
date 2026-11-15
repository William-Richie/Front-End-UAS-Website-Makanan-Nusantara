'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Container, Button, Card, Row, Col, Stack, Ratio } from 'react-bootstrap';
import styles from './LocationSection.module.css';
import { BranchMap } from '../Reservation/ReservationSection';

interface LocationSectionProps {
  branches: BranchMap[];
}

const ZOOM = 15;
const AUTO_MS = 5000;

const hasCoord = (b: BranchMap) =>
  Number.isFinite(b.latitude) && Number.isFinite(b.longitude) && (b.latitude !== 0 || b.longitude !== 0);

export default function LocationSection({ branches }: LocationSectionProps) {
  const [showMap, setShowMap] = useState(false);
  const [auto, setAuto] = useState(true);
  const [mapVersion, setMapVersion] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<BranchMap | null>(
    branches[0] || null
  );

  const mapElRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ down: false, startX: 0, startLeft: 0, moved: false });
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());

  const activeBranch = selectedBranch || branches[0];
  const activeId = activeBranch?.id;

  useEffect(() => {
    const el = mapElRef.current;
    const valid = branches.filter(hasCoord);
    if (!showMap || !el || valid.length === 0) return;

    let cancelled = false;
    let map: LeafletMap | null = null;

    (async () => {
      const L = await import('leaflet');
      if (cancelled) return;

      map = L.map(el, { scrollWheelZoom: false }).setView(
        [valid[0].latitude, valid[0].longitude],
        ZOOM
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const icon = L.divIcon({
        className: styles.pinWrap,
        html: `<span class="${styles.pin}"><i class="fa-solid fa-utensils"></i></span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 50],
        popupAnchor: [0, -52],
      });

      const markers = new Map<number, Marker>();
      valid.forEach((b) => {
        const box = document.createElement('div');
        const title = document.createElement('strong');
        title.className = styles.popupTitle;
        title.textContent = b.nama;
        const text = document.createElement('span');
        text.className = styles.popupText;
        text.textContent = b.alamat;
        box.append(title, text);

        const marker = L.marker([b.latitude, b.longitude], { icon, title: b.nama })
          .addTo(map!)
          .bindPopup(box);

        marker.on('click', () => {
          setAuto(false);
          setSelectedBranch(b);
        });
        markers.set(b.id, marker);
      });

      mapRef.current = map;
      markersRef.current = markers;
      setMapVersion((v) => v + 1);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      markersRef.current = new Map();
    };
  }, [showMap, branches]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = activeId !== undefined ? markersRef.current.get(activeId) : undefined;
    if (!map || !marker) return;

    const target = marker.getLatLng();
    const openPopup = () => marker.openPopup();

    if (map.getCenter().distanceTo(target) < 5 && map.getZoom() === ZOOM) {
      openPopup();
      return;
    }

    map.closePopup();
    map.once('moveend', openPopup);
    map.flyTo(target, ZOOM, { duration: 1.6 });

    return () => {
      map.off('moveend', openPopup);
    };
  }, [activeId, mapVersion]);

  useEffect(() => {
    if (!showMap || !auto || branches.length < 2) return;

    const timer = setTimeout(() => {
      const i = branches.findIndex((b) => b.id === activeId);
      setSelectedBranch(branches[(i + 1) % branches.length]);
    }, AUTO_MS);

    return () => clearTimeout(timer);
  }, [showMap, auto, branches, activeId]);

  useEffect(() => {
    const row = tabsRef.current;
    const tab = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!row || !tab) return;
    row.scrollTo({
      left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }, [activeId, showMap]);

  const onTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !tabsRef.current) return;
    dragRef.current = { down: true, startX: e.clientX, startLeft: tabsRef.current.scrollLeft, moved: false };
  };

  const onTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const row = tabsRef.current;
    if (!d.down || !row) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      row.setPointerCapture(e.pointerId);
    }
    if (d.moved) row.scrollLeft = d.startLeft - dx;
  };

  const onTabsPointerEnd = () => {
    dragRef.current.down = false;
  };

  const onTabsClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  const toggleMap = () => {
    if (!showMap) {
      setSelectedBranch(branches[0] || null);
      setAuto(true);
    }
    setShowMap((prev) => !prev);
  };

  const pickBranch = (b: BranchMap) => {
    setAuto(false);
    setSelectedBranch(b);
  };

  return (
    <section id="location" className={`page-section ${styles.locSection}`}>
      <div className={styles.locMotif} aria-hidden="true"></div>

      <div className={styles.locHero}>
        <div className={styles.locHeroBg} aria-hidden="true">
          <span className={styles.locRings}></span>
        </div>

        <span className={`${styles.locPin} ${styles.p1}`} aria-hidden="true"><i className="fa-solid fa-location-dot"></i></span>
        <span className={`${styles.locPin} ${styles.p2}`} aria-hidden="true"><i className="fa-solid fa-map-location-dot"></i></span>
        <span className={`${styles.locPin} ${styles.p3}`} aria-hidden="true"><i className="fa-solid fa-location-dot"></i></span>
        <span className={`${styles.locPin} ${styles.p4}`} aria-hidden="true"><i className="fa-solid fa-map-pin"></i></span>

        <Container className="text-center position-relative">
          <p className="hero-eyebrow reveal" id="loc-eyebrow">Temukan Kami</p>
          <h1 className={`${styles.locTitle} reveal reveal-d1`} id="loc-title">
            Let&apos;s See Our<br /><em>Restaurant Location</em>
          </h1>
          <ul className="loc-chips reveal reveal-d2">
            <li>
              <i className="fa-solid fa-store"></i>
              <span id="banner-total-cabang">{branches.length} Cabang</span>
            </li>
            <li>
              <i className="fa-solid fa-route"></i>
              <span id="loc-chip2">Jakarta hingga Papua</span>
            </li>
          </ul>
        </Container>
      </div>

      <div className={styles.locWrap}>
        <div className={styles.locGrid}>
          <article className={`${styles.locIntro} reveal`}>
            <p className="sec-kicker" id="loc-kicker">Rasakan Cita Rasa Kami</p>
            <h2 id="loc-heading">Warmth in Every Dish, Flavors from Eastern Indonesia</h2>
            <p className={styles.locDesc} id="loc-desc">
              Mampir ke gerai terdekat dan nikmati papeda dengan kuah kuning yang masih hangat. Buka peta untuk menjelajahi semua cabang kami.
            </p>
            <button
              type="button"
              id="btn-open-map"
              className={styles.mapBtn}
              onClick={toggleMap}
            >
              <i className="fa-solid fa-location-dot me-2"></i>
              <span id="loc-btn">{showMap ? 'Tutup Peta' : 'Lihat Peta Cabang'}</span>
            </button>
          </article>

          <ul className={styles.locCards}>
            <li className="reveal" style={{ '--d': '0.1s' } as React.CSSProperties}>
              <div className={styles.locCard}>
                <span className={styles.locIcon}><i className="fa-solid fa-location-dot"></i></span>
                <div>
                  <h3 id="loc-utama-title">Cabang Utama</h3>
                  <p id="loc-utama-text">Jl. Cendrawasih No. 45, Jakarta</p>
                </div>
              </div>
            </li>
            <li className="reveal" style={{ '--d': '0.2s' } as React.CSSProperties}>
              <a className={styles.locCard} id="loc-telp-link" href="tel:+622112345678">
                <span className={styles.locIcon}><i className="fa-solid fa-phone"></i></span>
                <div>
                  <h3 id="loc-telp-title">Telepon</h3>
                  <p id="loc-telp-text">(021) 1234-5678</p>
                </div>
              </a>
            </li>
            <li className="reveal" style={{ '--d': '0.3s' } as React.CSSProperties}>
              <a className={styles.locCard} id="loc-email-link" href="mailto:halo@papedarestaurant.com">
                <span className={styles.locIcon}><i className="fa-solid fa-envelope"></i></span>
                <div>
                  <h3 id="loc-email-title">Email</h3>
                  <p id="loc-email-text">halo@papedarestaurant.com</p>
                </div>
              </a>
            </li>
            <li className="reveal" style={{ '--d': '0.4s' } as React.CSSProperties}>
              <div className={styles.locCard}>
                <span className={styles.locIcon}><i className="fa-solid fa-square-parking"></i></span>
                <div>
                  <h3 id="loc-parkir-title">Parkir</h3>
                  <p id="loc-parkir-text">Area luas untuk roda dua maupun roda empat</p>
                </div>
              </div>
            </li>
          </ul>
        </div>

        {showMap && (
          <div id="map-reveal" className={styles.mapReveal}>
            <Card className={styles.mapCard}>
              <Card.Body className={styles.mapBody}>
                {branches.length === 0 ? (
                  <p className={styles.mapEmpty}>
                    <i className="fa-regular fa-map me-2"></i>Belum ada data cabang.
                  </p>
                ) : (
                  <>
                    <Row
                      ref={tabsRef}
                      id="branch-list"
                      className={`${styles.branchRow} g-2 flex-nowrap`}
                      role="tablist"
                      onPointerDown={onTabsPointerDown}
                      onPointerMove={onTabsPointerMove}
                      onPointerUp={onTabsPointerEnd}
                      onPointerCancel={onTabsPointerEnd}
                      onClickCapture={onTabsClickCapture}
                    >
                      {branches.map((b) => (
                        <Col key={b.id} className={styles.branchCol}>
                          <Button
                            variant="outline-secondary"
                            role="tab"
                            aria-selected={activeId === b.id}
                            active={activeId === b.id}
                            className={`${styles.branchTab} w-100 h-100`}
                            onClick={() => pickBranch(b)}
                          >
                            <i className="fa-solid fa-location-dot"></i>
                            <span>{b.nama}</span>
                          </Button>
                        </Col>
                      ))}
                    </Row>

                    <Stack
                      direction="horizontal"
                      gap={2}
                      className={`${styles.mapBar} flex-wrap justify-content-between`}
                    >
                      <p className={styles.mapSelected}>
                        Lokasi dipilih: {activeBranch?.nama}
                      </p>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        aria-pressed={auto}
                        className={`${styles.autoBtn} ${auto ? styles.autoOn : ''}`}
                        onClick={() => setAuto((prev) => !prev)}
                      >
                        <i className={`fa-solid fa-rotate me-1 ${auto ? 'fa-spin' : ''}`}></i>
                        Jelajah otomatis
                      </Button>
                    </Stack>

                    <Ratio aspectRatio="16x9" className={styles.mapRatio}>
                      <div ref={mapElRef} className={styles.mapCanvas} />
                    </Ratio>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}