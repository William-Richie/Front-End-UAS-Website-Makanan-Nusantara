'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface Coord {
  lat: number;
  lng: number;
}

interface DeliveryPickerProps {
  branchLat: number;
  branchLng: number;
  branchName: string;
  value: Coord | null;
  onPick: (c: Coord) => void;
}

const PIN_HTML =
  '<i class="fa-solid fa-location-dot" style="font-size:34px;color:#c0392b;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))"></i>';
const BRANCH_HTML =
  '<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#7a4a1e;color:#fff;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"><i class="fa-solid fa-utensils"></i></span>';

export default function DeliveryPicker({ branchLat, branchLng, branchName, value, onPick }: DeliveryPickerProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const pinRef = useRef<Marker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const [mapVersion, setMapVersion] = useState(0);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelled) return;

      const map = L.map(el, { scrollWheelZoom: false }).setView([branchLat, branchLng], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.marker([branchLat, branchLng], {
        icon: L.divIcon({ className: '', html: BRANCH_HTML, iconSize: [34, 34], iconAnchor: [17, 17] }),
        title: branchName,
        keyboard: false,
      }).addTo(map);

      map.on('click', (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }));

      mapRef.current = map;
      leafletRef.current = L;
      setMapVersion((v) => v + 1);
      setTimeout(() => {
        if (mapRef.current === map) map.invalidateSize();
      }, 250);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      pinRef.current = null;
    };
  }, [branchLat, branchLng, branchName, onPick]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    if (!value) {
      pinRef.current?.remove();
      pinRef.current = null;
      return;
    }

    if (!pinRef.current) {
      const pin = L.marker([value.lat, value.lng], {
        icon: L.divIcon({ className: '', html: PIN_HTML, iconSize: [34, 34], iconAnchor: [17, 34] }),
        draggable: true,
        title: 'Lokasi pengantaran',
      }).addTo(map);
      pin.on('dragend', () => {
        const p = pin.getLatLng();
        onPick({ lat: p.lat, lng: p.lng });
      });
      pinRef.current = pin;
    } else {
      pinRef.current.setLatLng([value.lat, value.lng]);
    }

    if (!map.getBounds().contains([value.lat, value.lng])) {
      map.fitBounds(
        L.latLngBounds([
          [branchLat, branchLng],
          [value.lat, value.lng],
        ]),
        { padding: [40, 40], maxZoom: 16 }
      );
    }
  }, [value, mapVersion, onPick, branchLat, branchLng]);

  return (
    <div
      ref={elRef}
      role="application"
      aria-label="Peta untuk memilih lokasi pengantaran"
      style={{ height: 260, width: '100%', borderRadius: 12, overflow: 'hidden', margin: '8px 0', isolation: 'isolate' }}
    />
  );
}