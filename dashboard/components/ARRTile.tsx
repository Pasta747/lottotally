'use client';

import { useEffect, useState } from 'react';

interface ProductMetrics {
  pinger: { arr: number; mrr: number; forecast: number; status: string };
  canopy: { arr: number; mrr: number; forecast: number; status: string };
  lottotally: { arr: number; mrr: number; forecast: number; status: string };
  vantage: { arr: number; mrr: number; forecast: number; status: string };
}

interface MetricsResponse {
  products: ProductMetrics;
  total_arr: number;
  total_mrr: number;
  burn_monthly: number;
  pipeline: number;
  last_updated: string;
}

function formatCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export default function ARRTile({ refreshInterval = 60000 }: { refreshInterval?: number }) {
  const [data, setData] = useState<MetricsResponse | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await fetch('/api/data/metrics');
        const json = await res.json();
        setData(json);
      } catch {
        // show last known
      }
    }
    fetch();
    const iv = setInterval(fetch, refreshInterval);
    return () => clearInterval(iv);
  }, [refreshInterval]);

  if (!data) return <div className="arr-tile arr-loading">Loading...</div>;

  const products = [
    { key: 'pinger', label: 'Pinger', data: data.products.pinger },
    { key: 'canopy', label: 'Canopy', data: data.products.canopy },
    { key: 'lottotally', label: 'LottoTally', data: data.products.lottotally },
    { key: 'vantage', label: 'Vantage', data: data.products.vantage },
  ];

  const totalHealth = products.every(p => p.data.status !== 'red') ? 'green'
    : products.some(p => p.data.status === 'red') ? 'red' : 'yellow';

  return (
    <div className="arr-tile">
      <div className="arr-header">
        <span className="arr-title">ARR</span>
        <span className={`arr-badge ${totalHealth}`}>
          {totalHealth === 'green' ? '🟢' : totalHealth === 'yellow' ? '🟡' : '🔴'}
        </span>
      </div>
      <div className="arr-total">
        <span className="arr-value">{formatCurrency(data.total_arr)}</span>
        <span className="arr-label">Total ARR</span>
      </div>
      <div className="arr-sub">
        <span>MRR: {formatCurrency(data.total_mrr)}</span>
        <span>Burn: {formatCurrency(data.burn_monthly)}/mo</span>
      </div>
      <div className="arr-products">
        {products.map(p => (
          <div key={p.key} className={`arr-product-row ${p.data.status}`}>
            <span className="arr-product-name">{p.label}</span>
            <span className="arr-product-arr">{formatCurrency(p.data.arr)}</span>
            <span className="arr-product-forecast">/ {formatCurrency(p.data.forecast)}</span>
            <span className="arr-product-status">
              {p.data.status === 'green' ? '🟢' : p.data.status === 'yellow' ? '🟡' : '🔴'}
            </span>
          </div>
        ))}
      </div>
      <div className="arr-pipeline">
        Pipeline: {formatCurrency(data.pipeline)}
      </div>
    </div>
  );
}
