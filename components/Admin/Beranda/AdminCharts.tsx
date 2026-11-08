'use client';

export interface ChartPoint {
  label: string;
  value: number;
}

export const singkat = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} rb`;
  return String(n);
};

interface BarChartProps {
  data: ChartPoint[];
  format?: (n: number) => string;
  ringkas?: (n: number) => string;
  kosong?: string;
}

export function BarChart({ data, format = String, ringkas = String, kosong = 'Belum ada data.' }: BarChartProps) {
  const max = Math.max(0, ...data.map((d) => d.value));
  if (max === 0) return <div className="chart-empty">{kosong}</div>;

  // label terlalu rapat kalau batangnya banyak (mis. 24 jam)
  const step = data.length > 12 ? Math.ceil(data.length / 8) : 1;

  return (
    <div className="chart-bars" role="img" aria-label={data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')}>
      {data.map((d, i) => (
        <div className="chart-col" key={`${d.label}-${i}`} title={`${d.label}: ${format(d.value)}`}>
          <span className="chart-val">{d.value > 0 && data.length <= 12 ? ringkas(d.value) : ''}</span>
          <div className="chart-track">
            <div
              className="chart-bar"
              style={{ height: `${d.value > 0 ? Math.max((d.value / max) * 100, 4) : 0}%` }}
            />
          </div>
          <span className="chart-label">{i % step === 0 ? d.label : ''}</span>
        </div>
      ))}
    </div>
  );
}

export interface StatusItem {
  label: string;
  value: number;
  warna: string;
}

export function StatusBars({ items }: { items: StatusItem[] }) {
  const total = items.reduce((t, i) => t + i.value, 0);
  if (total === 0) return <div className="chart-empty">Belum ada data.</div>;

  return (
    <div className="status-bars">
      {items.map((it) => (
        <div className="status-row" key={it.label}>
          <div className="status-head">
            <span>{it.label}</span>
            <strong>{it.value}</strong>
          </div>
          <div className="status-track">
            <div className="status-fill" style={{ width: `${(it.value / total) * 100}%`, background: it.warna }} />
          </div>
        </div>
      ))}
    </div>
  );
}