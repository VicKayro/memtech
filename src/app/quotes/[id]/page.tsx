'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Scale } from 'lucide-react';
import type { QuoteComparison, QuoteLineItem } from '@/types';

export default function QuoteDetailPage() {
  const { id } = useParams();
  const [comparison, setComparison] = useState<QuoteComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setComparison(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const exportCSV = () => {
    if (!comparison) return;
    const suppliers = comparison.suppliers || [];
    const lines = comparison.line_items || [];

    const headers = ['Désignation', 'Unité', 'Qté', ...suppliers.map((s) => s.name + ' (€ HT)')];
    const rows = lines.map((line: QuoteLineItem) => [
      line.designation,
      line.unit,
      line.qty ?? '',
      ...suppliers.map((s) => line.prices?.[s.name] ?? ''),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${comparison.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  if (!comparison) {
    return <div className="text-center py-20 text-gray-500">Comparatif non trouvé</div>;
  }

  const suppliers = comparison.suppliers || [];
  const lines = comparison.line_items || [];

  // Find cheapest per line
  const getCheapest = (line: QuoteLineItem) => {
    let minPrice = Infinity;
    let minSupplier = '';
    for (const s of suppliers) {
      const price = line.prices?.[s.name];
      if (price != null && price < minPrice) {
        minPrice = price;
        minSupplier = s.name;
      }
    }
    return minSupplier;
  };

  // Totals per supplier
  const totals: Record<string, number> = {};
  for (const s of suppliers) {
    totals[s.name] = lines.reduce((sum: number, line: QuoteLineItem) => {
      const price = line.prices?.[s.name];
      const qty = line.qty || 1;
      return sum + (price != null ? price * qty : 0);
    }, 0);
  }
  const cheapestTotal = Object.entries(totals).reduce(
    (min, [name, total]) => (total < min.total ? { name, total } : min),
    { name: '', total: Infinity },
  );

  return (
    <div>
      <Link href="/quotes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour aux comparatifs
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="h-6 w-6 text-indigo-600" />
            {comparison.name}
          </h1>
          <p className="text-gray-500 mt-1">
            {suppliers.length} fournisseurs &middot; {lines.length} lignes comparées
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exporter CSV
        </button>
      </div>

      {/* Totals Summary */}
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${suppliers.length}, 1fr)` }}>
        {suppliers.map((s) => (
          <div
            key={s.name}
            className={`rounded-xl border p-4 ${
              cheapestTotal.name === s.name
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-sm font-medium text-gray-600">{s.name}</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {totals[s.name].toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </div>
            {cheapestTotal.name === s.name && (
              <div className="text-xs text-green-600 font-medium mt-1">Moins-disant</div>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50">Désignation</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600">Unité</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600">Qté</th>
              {suppliers.map((s) => (
                <th key={s.name} className="text-right px-4 py-3 font-medium text-gray-600">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line: QuoteLineItem, i: number) => {
              const cheapest = getCheapest(line);
              return (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 sticky left-0 bg-white">{line.designation}</td>
                  <td className="px-3 py-3 text-gray-500">{line.unit}</td>
                  <td className="px-3 py-3 text-right text-gray-500">{line.qty ?? '—'}</td>
                  {suppliers.map((s) => {
                    const price = line.prices?.[s.name];
                    const isCheapest = s.name === cheapest && price != null;
                    return (
                      <td
                        key={s.name}
                        className={`px-4 py-3 text-right font-mono ${
                          isCheapest ? 'text-green-700 font-semibold bg-green-50' : 'text-gray-900'
                        }`}
                      >
                        {price != null ? `${Number(price).toFixed(2)} €` : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td className="px-4 py-3 font-semibold text-gray-900 sticky left-0 bg-gray-50">TOTAL HT</td>
              <td className="px-3 py-3"></td>
              <td className="px-3 py-3"></td>
              {suppliers.map((s) => (
                <td
                  key={s.name}
                  className={`px-4 py-3 text-right font-mono font-bold ${
                    cheapestTotal.name === s.name ? 'text-green-700' : 'text-gray-900'
                  }`}
                >
                  {totals[s.name].toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
