'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowRight, Scale, X } from 'lucide-react';
import Link from 'next/link';
import type { QuoteComparison } from '@/types';
import FileUpload from '@/components/file-upload';

async function parseFileContent(file: File): Promise<string> {
  if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
    return file.text();
  }
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

interface SupplierEntry {
  name: string;
  file: File | null;
}

export default function QuotesPage() {
  const [comparisons, setComparisons] = useState<QuoteComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierEntry[]>([
    { name: '', file: null },
    { name: '', file: null },
  ]);

  useEffect(() => {
    fetch('/api/quotes')
      .then((r) => r.json())
      .then((data) => {
        setComparisons(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/quotes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setComparisons((prev) => prev.filter((c) => c.id !== id));
  };

  const addSupplier = () => {
    if (suppliers.length < 5) {
      setSuppliers([...suppliers, { name: '', file: null }]);
    }
  };

  const updateSupplier = (index: number, field: keyof SupplierEntry, value: string | File | null) => {
    const updated = [...suppliers];
    updated[index] = { ...updated[index], [field]: value };
    setSuppliers(updated);
  };

  const removeSupplier = (index: number) => {
    if (suppliers.length > 2) {
      setSuppliers(suppliers.filter((_, i) => i !== index));
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const validSuppliers = suppliers.filter((s) => s.name.trim() && s.file);
    if (validSuppliers.length < 2) return;

    setCreating(true);
    try {
      // Step 1: Create the comparison
      const createRes = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          suppliers: validSuppliers.map((s) => ({ name: s.name, file_name: s.file!.name })),
        }),
      });
      const comparison = await createRes.json();

      // Step 2: Parse files and analyze
      const quotes = await Promise.all(
        validSuppliers.map(async (s) => ({
          supplier_name: s.name,
          file_name: s.file!.name,
          content: await parseFileContent(s.file!),
        })),
      );

      const analyzeRes = await fetch('/api/quotes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comparison.id, quotes }),
      });
      const result = await analyzeRes.json();

      setComparisons((prev) => [result, ...prev.filter((c) => c.id !== comparison.id)]);
      setShowNew(false);
      setNewName('');
      setSuppliers([{ name: '', file: null }, { name: '', file: null }]);
    } catch {
      // error handled silently
    } finally {
      setCreating(false);
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'done') return { text: 'Terminé', color: 'bg-green-100 text-green-700' };
    if (status === 'analyzing') return { text: 'En cours...', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'En attente', color: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="h-6 w-6 text-indigo-600" />
            Comparatifs de devis
          </h1>
          <p className="text-gray-500 mt-1">Comparez les devis fournisseurs automatiquement</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau comparatif
        </button>
      </div>

      {/* New Comparison Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau comparatif</h2>
              <button onClick={() => { setShowNew(false); setCreating(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du comparatif</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Comparatif lot Gros Oeuvre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Devis fournisseurs (2-5)</label>
                  {suppliers.length < 5 && (
                    <button onClick={addSupplier} className="text-sm text-blue-600 hover:text-blue-800">
                      + Ajouter un fournisseur
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {suppliers.map((supplier, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-400">#{i + 1}</span>
                        <input
                          type="text"
                          value={supplier.name}
                          onChange={(e) => updateSupplier(i, 'name', e.target.value)}
                          placeholder="Nom du fournisseur"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {suppliers.length > 2 && (
                          <button onClick={() => removeSupplier(i)} className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <FileUpload
                        files={supplier.file ? [supplier.file] : []}
                        onFilesChange={(files) => updateSupplier(i, 'file', files[0] || null)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || suppliers.filter((s) => s.name.trim() && s.file).length < 2 || creating}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Analyse en cours...' : 'Créer et analyser'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : comparisons.length === 0 ? (
        <div className="text-center py-20">
          <Scale className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Aucun comparatif pour l&apos;instant</p>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            Uploadez 2 à 5 devis fournisseurs pour générer un tableau comparatif automatique.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comparisons.map((comp) => {
            const st = statusLabel(comp.status);
            return (
              <div key={comp.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">{comp.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {comp.suppliers?.length || 0} fournisseurs &middot; {comp.line_items?.length || 0} lignes &middot; {new Date(comp.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {comp.status === 'done' && (
                    <Link
                      href={`/quotes/${comp.id}`}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(comp.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
