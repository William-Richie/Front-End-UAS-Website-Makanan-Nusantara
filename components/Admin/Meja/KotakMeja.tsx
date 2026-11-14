'use client';

import { useState } from 'react';
import type { TipeMeja } from '@/lib/mejaTipe';

export interface MejaItem {
  id: number;
  tipe: TipeMeja;
  nomor: number;
  kapMin: number;
  kapMaks: number;
  published: boolean;
  open: boolean;
  catatan: string;
  dipesan: boolean;
  bisaDipilih: boolean;
}

interface Props {
  meja: MejaItem;
  gambar: string;
  jam: string;
  onUbah: (perubahan: Record<string, unknown>) => void;
}

export default function KotakMeja({ meja, gambar, jam, onUbah }: Props) {
  const [catatan, setCatatan] = useState(meja.catatan);
  const [kapMin, setKapMin] = useState(meja.kapMin);
  const [kapMaks, setKapMaks] = useState(meja.kapMaks);
  const label = String(meja.nomor).padStart(2, '0');

  const simpanKapasitas = () => {
    if (kapMin !== meja.kapMin || kapMaks !== meja.kapMaks) {
      onUbah({ meja_id: meja.id, kapMin, kapMaks });
    }
  };

  return (
    <div className={`meja-card ${meja.published ? '' : 'meja-draft'}`}>
      <div className="meja-img-wrap">
        <span className={`meja-tag tag-${meja.tipe}`}>{label}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gambar} alt={`Meja ${label}`} />
      </div>

      <div className="meja-body">
        <div className="meja-row">
          <span>Waktu: {jam}</span>
          <button
            type="button"
            className={`meja-state ${meja.open ? 'is-open' : 'is-closed'}`}
            disabled={meja.dipesan}
            onClick={() => onUbah({ meja_id: meja.id, open: !meja.open })}
          >
            {meja.dipesan ? 'Dipesan' : meja.open ? 'Open' : 'Close'}
          </button>
        </div>

        <div className="meja-kap">
          <i className="fa-solid fa-user"></i>
          <input type="number" min={1} max={50} className="form-control"
            value={kapMin} onChange={(e) => setKapMin(Number(e.target.value))} onBlur={simpanKapasitas} />
          <span>-</span>
          <input type="number" min={1} max={50} className="form-control"
            value={kapMaks} onChange={(e) => setKapMaks(Number(e.target.value))} onBlur={simpanKapasitas} />
        </div>

        <textarea
          className="form-control"
          maxLength={100}
          placeholder="Catatan (maks 100 karakter)"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          onBlur={() => catatan !== meja.catatan && onUbah({ meja_id: meja.id, catatan })}
        />
        <div className="meja-count">{catatan.length}/100</div>

        <button
          type="button"
          className={`meja-btn ${meja.published ? 'btn-cancel' : 'btn-confirm'}`}
          onClick={() => onUbah({ meja_id: meja.id, published: !meja.published })}
        >
          {meja.published ? 'Cancel' : 'Confirm'}
        </button>

        <button
          type="button"
          className="meja-link"
          onClick={() =>
            onUbah({ meja_id: meja.id, published: meja.published, open: meja.open, catatan, semua: true })
          }
        >
          Terapkan ke semua jam &amp; tanggal
        </button>
      </div>
    </div>
  );
}