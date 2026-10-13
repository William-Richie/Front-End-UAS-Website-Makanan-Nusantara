'use client';

import { useState } from 'react';
import { BranchMap } from './ReservationSection';

interface LocationSectionProps {
  branches: BranchMap[];
}

export default function LocationSection({ branches }: LocationSectionProps) {
  const [showMap, setShowMap] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchMap | null>(
    branches[0] || null
  );

  const activeBranch = selectedBranch || branches[0];

  return (
    <section id="location" className="page-section loc-section">
      <div className="loc-motif" aria-hidden="true"></div>

      <div className="loc-hero">
        <div className="loc-hero-bg" aria-hidden="true">
          <span className="loc-rings"></span>
        </div>

        <span className="loc-pin p1" aria-hidden="true"><i className="fa-solid fa-location-dot"></i></span>
        <span className="loc-pin p2" aria-hidden="true"><i className="fa-solid fa-map-location-dot"></i></span>
        <span className="loc-pin p3" aria-hidden="true"><i className="fa-solid fa-location-dot"></i></span>
        <span className="loc-pin p4" aria-hidden="true"><i className="fa-solid fa-map-pin"></i></span>

        <div className="container text-center position-relative section-content-wrap">
          <p className="hero-eyebrow reveal" id="loc-eyebrow">Temukan Kami</p>
          <h1 className="loc-title reveal" id="loc-title">
            Let&apos;s See Our<br /><em>Restaurant Location</em>
          </h1>
          <ul className="loc-chips reveal">
            <li>
              <i className="fa-solid fa-store"></i>
              <span id="banner-total-cabang">{branches.length} Cabang</span>
            </li>
            <li>
              <i className="fa-solid fa-route"></i>
              <span id="loc-chip2">Jakarta hingga Papua</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="loc-wrap">
        <div className="loc-grid">
          <article className="loc-intro reveal">
            <p className="loc-kicker" id="loc-kicker">Rasakan Cita Rasa Kami</p>
            <h2 id="loc-heading">Warmth in Every Dish, Flavors from Eastern Indonesia</h2>
            <p className="loc-desc" id="loc-desc">
              Mampir ke gerai terdekat dan nikmati papeda dengan kuah kuning yang masih hangat. Buka peta untuk menjelajahi semua cabang kami.
            </p>
            <button
              type="button"
              id="btn-open-map"
              className="btn-map-open"
              onClick={() => setShowMap((prev) => !prev)}
            >
              <i className="fa-solid fa-location-dot me-2"></i>
              <span id="loc-btn">{showMap ? 'Tutup Peta' : 'Lihat Peta Cabang'}</span>
            </button>
          </article>

          <ul className="loc-cards">
            <li className="reveal">
              <div className="loc-card">
                <span className="loc-icon"><i className="fa-solid fa-location-dot"></i></span>
                <div>
                  <h3 id="loc-utama-title">Cabang Utama</h3>
                  <p id="loc-utama-text">{activeBranch?.alamat || 'Jl. Cendrawasih No. 45, Jakarta'}</p>
                </div>
              </div>
            </li>
            <li className="reveal">
              <a className="loc-card" id="loc-telp-link" href="tel:+622112345678">
                <span className="loc-icon"><i className="fa-solid fa-phone"></i></span>
                <div>
                  <h3 id="loc-telp-title">Telepon</h3>
                  <p id="loc-telp-text">(021) 1234-5678</p>
                </div>
              </a>
            </li>
            <li className="reveal">
              <a className="loc-card" id="loc-email-link" href="mailto:halo@papedarestaurant.com">
                <span className="loc-icon"><i className="fa-solid fa-envelope"></i></span>
                <div>
                  <h3 id="loc-email-title">Email</h3>
                  <p id="loc-email-text">halo@papedarestaurant.com</p>
                </div>
              </a>
            </li>
            <li className="reveal">
              <div className="loc-card">
                <span className="loc-icon"><i className="fa-solid fa-square-parking"></i></span>
                <div>
                  <h3 id="loc-parkir-title">Parkir</h3>
                  <p id="loc-parkir-text">Area luas untuk roda dua maupun roda empat</p>
                </div>
              </div>
            </li>
          </ul>
        </div>

        {showMap && (
          <div id="map-reveal" className="map-reveal open d-block mt-4">
            <div className="map-reveal-inner p-3 bg-white rounded shadow-sm">
              <div className="map-panel">
                <div id="branch-list" className="branch-list d-flex gap-2 overflow-auto pb-3">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`btn btn-sm ${activeBranch?.id === b.id ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setSelectedBranch(b)}
                    >
                      {b.nama}
                    </button>
                  ))}
                </div>

                {activeBranch && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <h5>{activeBranch.nama}</h5>
                    <p className="text-muted small mb-2">{activeBranch.alamat}</p>
                    <a
                      href={`https://www.google.com/maps?q=${activeBranch.latitude},${activeBranch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-papeda"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square me-1"></i> Buka di Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
