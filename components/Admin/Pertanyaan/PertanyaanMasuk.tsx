'use client';

import { Fragment, useState } from 'react';
import type { PertanyaanItem } from './types';

type FilterKey = 'belum' | 'dibaca' | 'dijawab';

const FILTER: [FilterKey, string][] = [
  ['belum', 'Belum dibaca'],
  ['dibaca', 'Dibaca'],
  ['dijawab', 'Dijawab'],
];

const PESAN_KOSONG: Record<FilterKey, string> = {
  belum: 'Tidak ada pertanyaan yang belum dibaca.',
  dibaca: 'Tidak ada pertanyaan yang sudah dibaca dan menunggu jawaban.',
  dijawab: 'Belum ada pertanyaan yang dijawab.',
};

const statusDari = (q: PertanyaanItem): FilterKey => (q.dijawab_at ? 'dijawab' : q.dibaca ? 'dibaca' : 'belum');

const formatTanggal = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

interface PertanyaanMasukProps {
  items: PertanyaanItem[];
  onTandaiDibaca: (id: number) => Promise<boolean>;
  onJawab: (id: number, jawaban: string) => Promise<boolean>;
}

export default function PertanyaanMasuk({ items, onTandaiDibaca, onJawab }: PertanyaanMasukProps) {
  const [filter, setFilter] = useState<FilterKey>('belum');
  const [cari, setCari] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [proses, setProses] = useState(false);

  const jumlah = (k: FilterKey) => items.filter((q) => statusDari(q) === k).length;

  const kata = cari.trim().toLowerCase();
  const tampil = items.filter(
    (q) =>
      statusDari(q) === filter &&
      (!kata || [q.nama, q.email, q.pertanyaan, q.jawaban ?? ''].some((t) => t.toLowerCase().includes(kata)))
  );

  const bukaEditor = (q: PertanyaanItem) => {
    setEditId(q.id);
    setDraft(q.jawaban ?? '');
  };
  const tutupEditor = () => {
    setEditId(null);
    setDraft('');
  };

  const kirim = async (q: PertanyaanItem) => {
    setProses(true);
    const berhasil = await onJawab(q.id, draft);
    setProses(false);
    if (berhasil) tutupEditor();
  };

  return (
    <div className="card shadow-sm border-0 p-4 mb-4">
      <div className="reservation-toolbar">
        <div className="reservation-tabs">
          {FILTER.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`tab-btn ${filter === key ? 'active' : ''}`}
              onClick={() => {
                setFilter(key);
                tutupEditor();
              }}
            >
              {label} <span className="badge">{jumlah(key)}</span>
            </button>
          ))}
        </div>

        <div className="reservation-tools">
          <input
            type="text"
            className="form-control"
            placeholder="Cari data..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table table table-striped align-middle" style={{ tableLayout: 'fixed', minWidth: 1000 }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '25%' }} />
            </colgroup>
          <thead className="table-dark">
            <tr>
              <th className="text-center">Pengirim</th>
              <th className="text-center">Pertanyaan</th>
              <th className="text-center">Dikirim</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tampil.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  {PESAN_KOSONG[filter]}
                </td>
              </tr>
            ) : (
              tampil.map((q) => {
                const status = statusDari(q);
                return (
                  <Fragment key={q.id}>
                    <tr>
                      <td>
                        <strong>{q.nama || '-'}</strong>
                        <br />
                        <small className="text-muted">{q.email || '-'}</small>
                        {!q.user_id && (
                          <>
                            <br />
                            <span className="badge bg-secondary">Tanpa akun</span>
                          </>
                        )}
                      </td>
                      <td>
                        <div className={status === 'belum' ? 'fw-bold' : ''}>{q.pertanyaan}</div>
                        {q.jawaban && (
                          <div className="small text-muted mt-2">
                            <strong>Jawaban:</strong> {q.jawaban}
                            <br />
                            Dijawab {formatTanggal(q.dijawab_at)}
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <small>{formatTanggal(q.created_at)}</small>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap justify-content-center gap-2">
                          {status === 'belum' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => onTandaiDibaca(q.id)}
                            >
                              Tandai dibaca
                            </button>
                          )}
                          {q.user_id ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-warning text-white fw-bold"
                              onClick={() => bukaEditor(q)}
                            >
                              {status === 'dijawab' ? 'Ubah Jawaban' : 'Jawab'}
                            </button>
                          ) : (
                            <small className="text-muted">Tidak bisa dijawab (pengirim tanpa akun)</small>
                          )}
                        </div>
                      </td>
                    </tr>

                    {editId === q.id && (
                      <tr>
                        <td colSpan={4}>
                          <label className="form-label small fw-bold mb-1" htmlFor={`jawab-${q.id}`}>
                            Jawaban untuk {q.nama} (masuk ke Mail pengguna)
                          </label>
                          <textarea
                            id={`jawab-${q.id}`}
                            className="form-control mb-2"
                            rows={3}
                            maxLength={1000}
                            placeholder="Tulis jawaban..."
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                          />
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              disabled={proses}
                              onClick={tutupEditor}
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-warning text-white fw-bold"
                              disabled={proses || draft.trim().length < 2}
                              onClick={() => kirim(q)}
                            >
                              <i className="fa-solid fa-paper-plane me-2"></i>
                              {proses ? 'Mengirim...' : status === 'dijawab' ? 'Kirim Ulang' : 'Kirim ke Mail'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
