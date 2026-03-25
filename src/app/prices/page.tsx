'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Upload, Search, X, Edit3, Check, BookOpen } from 'lucide-react';
import type { PriceItem } from '@/types';
import { PRICE_CATEGORIES, PRICE_UNITS } from '@/types';
import FileUpload from '@/components/file-upload';

// Client-side file parsing (reuse existing pattern)
async function parseFileContent(file: File): Promise<string> {
  if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
    return file.text();
  }
  // For PDF/DOCX, use the same approach as the upload page
  if (file.name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pages.push(tc.items.map((item: any) => ('str' in item ? item.str : '')).join(' '));
    }
    return pages.join('\n\n');
  }
  if (file.name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  return file.text();
}

export default function PricesPage() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [importProject, setImportProject] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PriceItem>>({});
  const [formData, setFormData] = useState({
    category: 'gros_oeuvre',
    subcategory: '',
    designation: '',
    unit: 'm²',
    unit_price: '',
    source_project: '',
    source_year: new Date().getFullYear().toString(),
    notes: '',
    carbon_kg_per_unit: '',
  });

  const fetchPrices = useCallback(() => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (search) params.set('search', search);
    fetch(`/api/prices?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPrices(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterCategory, search]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleAdd = async () => {
    if (!formData.designation.trim()) return;
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        carbon_kg_per_unit: formData.carbon_kg_per_unit ? parseFloat(formData.carbon_kg_per_unit) : null,
      }),
    });
    if (res.ok) {
      setFormData({
        category: 'gros_oeuvre', subcategory: '', designation: '', unit: 'm²',
        unit_price: '', source_project: '', source_year: new Date().getFullYear().toString(),
        notes: '', carbon_kg_per_unit: '',
      });
      setShowForm(false);
      fetchPrices();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/prices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setPrices((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEdit = (item: PriceItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const res = await fetch('/api/prices', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...editData }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchPrices();
    }
  };

  const handleImport = async () => {
    if (importFiles.length === 0) return;
    setImporting(true);
    try {
      for (const file of importFiles) {
        const content = await parseFileContent(file);
        await fetch('/api/prices/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            fileName: file.name,
            projectName: importProject || file.name,
          }),
        });
      }
      setShowImport(false);
      setImportFiles([]);
      setImportProject('');
      fetchPrices();
    } catch {
      // error handled silently
    } finally {
      setImporting(false);
    }
  };

  // Stats
  const categories = new Set(prices.map((p) => p.category));
  const withPrice = prices.filter((p) => p.unit_price != null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-600" />
            Bible de prix
          </h1>
          <p className="text-gray-500 mt-1">Base de prix historiques par lot et ouvrage</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importer un DPGF
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter un prix
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{prices.length}</div>
          <div className="text-sm text-gray-500">Prix enregistrés</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{categories.size}</div>
          <div className="text-sm text-gray-500">Catégories couvertes</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{withPrice.length}</div>
          <div className="text-sm text-gray-500">Avec prix unitaire</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une désignation..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Toutes catégories</option>
          {PRICE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Importer un DPGF</h2>
              <button onClick={() => { setShowImport(false); setImportFiles([]); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet source</label>
                <input
                  type="text"
                  value={importProject}
                  onChange={(e) => setImportProject(e.target.value)}
                  placeholder="Ex: EHPAD Wasquehal 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fichier DPGF (PDF, Excel, DOCX)</label>
                <FileUpload files={importFiles} onFilesChange={setImportFiles} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowImport(false); setImportFiles([]); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={importFiles.length === 0 || importing}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {importing ? 'Extraction en cours...' : 'Importer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau prix</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {PRICE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sous-catégorie</label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="Ex: fondations"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Désignation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Ex: Béton C25/30 XC1 en voiles"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {PRICE_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire HT</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">kg CO2e/u</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.carbon_kg_per_unit}
                    onChange={(e) => setFormData({ ...formData, carbon_kg_per_unit: e.target.value })}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projet source</label>
                  <input
                    type="text"
                    value={formData.source_project}
                    onChange={(e) => setFormData({ ...formData, source_project: e.target.value })}
                    placeholder="Ex: EHPAD Wasquehal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année source</label>
                  <input
                    type="text"
                    value={formData.source_year}
                    onChange={(e) => setFormData({ ...formData, source_year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!formData.designation.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : prices.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Aucun prix pour l&apos;instant</p>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            Ajoutez des prix manuellement ou importez un DPGF existant pour construire votre base.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Désignation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unité</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">PU HT</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">CO2e</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {prices.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                  {editingId === item.id ? (
                    <>
                      <td className="px-4 py-2">
                        <select
                          value={editData.category || ''}
                          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          {PRICE_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editData.designation || ''}
                          onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editData.unit || ''}
                          onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          {PRICE_UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editData.unit_price ?? ''}
                          onChange={(e) => setEditData({ ...editData, unit_price: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-2 py-1 border rounded text-sm text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editData.carbon_kg_per_unit ?? ''}
                          onChange={(e) => setEditData({ ...editData, carbon_kg_per_unit: e.target.value ? parseFloat(e.target.value) : null })}
                          className="w-full px-2 py-1 border rounded text-sm text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-400">{item.source_project}</td>
                      <td className="px-4 py-2">
                        <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-800">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:text-gray-600 ml-1">
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {PRICE_CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                        </span>
                        {item.subcategory && (
                          <span className="text-xs text-gray-400 ml-1">{item.subcategory}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{item.designation}</td>
                      <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-900">
                        {item.unit_price != null ? `${Number(item.unit_price).toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500 text-xs">
                        {item.carbon_kg_per_unit != null ? `${Number(item.carbon_kg_per_unit).toFixed(1)} kg` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {item.source_project && <div>{item.source_project}</div>}
                        {item.source_year && <div>{item.source_year}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-blue-600">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
