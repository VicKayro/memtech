'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Sparkles, Download, Calculator, Leaf } from 'lucide-react';
import type { Project, EstimateLineItem, PriceItem } from '@/types';
import { PRICE_UNITS } from '@/types';

export default function EstimatePage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [lines, setLines] = useState<EstimateLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then((r) => r.json()),
      fetch(`/api/estimates?project_id=${id}`).then((r) => r.json()),
      fetch('/api/prices').then((r) => r.json()),
    ]).then(([proj, estimate, allPrices]) => {
      setProject(proj);
      if (estimate?.line_items) setLines(estimate.line_items);
      setPrices(Array.isArray(allPrices) ? allPrices : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const totalHT = lines.reduce((sum, l) => sum + (l.total || 0), 0);
  const totalCarbon = lines.reduce((sum, l) => {
    if (l.carbon_kg_per_unit != null && l.qty) return sum + l.carbon_kg_per_unit * l.qty;
    return sum;
  }, 0);

  const addLine = () => {
    setLines([...lines, {
      price_item_id: null,
      designation: '',
      unit: 'm²',
      qty: 0,
      unit_price: 0,
      total: 0,
      carbon_kg_per_unit: null,
    }]);
  };

  const updateLine = (index: number, field: string, value: string | number | null) => {
    const updated = [...lines];
    const line = { ...updated[index], [field]: value };
    // Recalculate total
    line.total = (line.qty || 0) * (line.unit_price || 0);
    updated[index] = line;
    setLines(updated);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const selectPriceItem = (index: number, priceId: string) => {
    const price = prices.find((p) => p.id === priceId);
    if (!price) return;
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      price_item_id: price.id,
      designation: price.designation,
      unit: price.unit,
      unit_price: price.unit_price || 0,
      carbon_kg_per_unit: price.carbon_kg_per_unit,
      total: (updated[index].qty || 0) * (price.unit_price || 0),
    };
    setLines(updated);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id, line_items: lines }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [id, lines]);

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const res = await fetch('/api/estimates/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id }),
      });
      const suggestions = await res.json();
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        const newLines: EstimateLineItem[] = suggestions.map((s: EstimateLineItem & { rationale?: string }) => {
          const priceItem = prices.find((p) => p.id === s.price_item_id);
          return {
            price_item_id: s.price_item_id,
            designation: s.designation,
            unit: s.unit,
            qty: s.qty || 0,
            unit_price: s.unit_price || 0,
            total: (s.qty || 0) * (s.unit_price || 0),
            carbon_kg_per_unit: priceItem?.carbon_kg_per_unit ?? null,
          };
        });
        setLines([...lines, ...newLines]);
      }
    } finally {
      setSuggesting(false);
    }
  };

  const exportCSV = () => {
    if (lines.length === 0) return;
    const headers = ['Désignation', 'Unité', 'Quantité', 'PU HT (€)', 'Total HT (€)', 'kg CO₂e/u'];
    const rows = lines.map((l) => [
      l.designation, l.unit, l.qty, l.unit_price, l.total,
      l.carbon_kg_per_unit ?? '',
    ]);
    rows.push(['', '', '', 'TOTAL HT', totalHT, '']);

    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estimation_${project?.name || 'projet'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      <Link href={`/projects/${id}/outline`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Retour à la trame
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-emerald-600" />
            Chiffrage estimatif
          </h1>
          <p className="text-gray-500 mt-1">{project?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSuggest}
            disabled={suggesting || prices.length === 0}
            className="flex items-center gap-2 border border-amber-300 text-amber-700 bg-amber-50 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {suggesting ? 'Suggestions...' : 'Suggestions IA'}
          </button>
          <button
            onClick={exportCSV}
            disabled={lines.length === 0}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {saved ? 'Enregistré !' : saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </div>
          <div className="text-sm text-gray-500">Total HT estimé</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{lines.length}</div>
          <div className="text-sm text-gray-500">Lignes de chiffrage</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
            <Leaf className="h-5 w-5 text-green-600" />
            {totalCarbon > 0 ? `${(totalCarbon / 1000).toFixed(1)} t` : '—'}
          </div>
          <div className="text-sm text-gray-500">CO₂e estimé</div>
        </div>
      </div>

      {/* Editable Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-[35%]">Désignation</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 w-[8%]">Unité</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600 w-[10%]">Quantité</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600 w-[12%]">PU HT (€)</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600 w-[12%]">Total HT (€)</th>
              <th className="text-right px-3 py-3 font-medium text-gray-600 w-[10%]">kg CO₂e</th>
              <th className="text-left px-3 py-3 font-medium text-gray-600 w-[8%]">Bible</th>
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-4 py-2">
                  <input
                    value={line.designation}
                    onChange={(e) => updateLine(i, 'designation', e.target.value)}
                    placeholder="Désignation du poste"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={line.unit}
                    onChange={(e) => updateLine(i, 'unit', e.target.value)}
                    className="w-full px-1 py-1 border border-gray-200 rounded text-sm"
                  >
                    {PRICE_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={line.qty || ''}
                    onChange={(e) => updateLine(i, 'qty', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={line.unit_price || ''}
                    onChange={(e) => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right"
                  />
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-900">
                  {line.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-500 text-xs">
                  {line.carbon_kg_per_unit != null && line.qty
                    ? `${(line.carbon_kg_per_unit * line.qty).toFixed(1)}`
                    : '—'}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={line.price_item_id || ''}
                    onChange={(e) => selectPriceItem(i, e.target.value)}
                    className="w-full px-1 py-1 border border-gray-200 rounded text-xs text-gray-500"
                  >
                    <option value="">—</option>
                    {prices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.designation.slice(0, 30)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => removeLine(i)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300">
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">
                  TOTAL HT
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-gray-900">
                  {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </td>
                <td className="px-3 py-3 text-right font-mono font-semibold text-gray-600 text-xs">
                  {totalCarbon > 0 ? `${(totalCarbon / 1000).toFixed(1)} t CO₂e` : '—'}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button
        onClick={addLine}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
      >
        <Plus className="h-4 w-4" />
        Ajouter une ligne
      </button>
    </div>
  );
}
