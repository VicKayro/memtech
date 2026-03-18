'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Database, X } from 'lucide-react';
import type { KnowledgeBlock } from '@/types';
import { KNOWLEDGE_CATEGORIES } from '@/types';

export default function KnowledgePage() {
  const [blocks, setBlocks] = useState<KnowledgeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'methodologie',
    title: '',
    content: '',
  });

  useEffect(() => {
    fetch('/api/knowledge')
      .then((r) => r.json())
      .then((data) => {
        setBlocks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (res.ok) {
      setBlocks((prev) => [...prev, ...(Array.isArray(data) ? data : [data])]);
      setFormData({ category: 'methodologie', title: '', content: '' });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/knowledge', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const grouped = KNOWLEDGE_CATEGORIES.map((cat) => ({
    ...cat,
    blocks: blocks.filter((b) => b.category === cat.value),
  })).filter((g) => g.blocks.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Base de connaissances interne</h1>
          <p className="text-gray-500 mt-1">
            Ajoutez vos contenus types : moyens, méthodologie, références, certifications...
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter un bloc
        </button>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Nouveau bloc de connaissance
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {KNOWLEDGE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex : Équipe type chantier CVC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="Décrivez le contenu en détail. Ce texte sera utilisé comme base pour la rédaction des sections du mémoire technique."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!formData.title.trim() || !formData.content.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-20">
          <Database className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Aucun contenu pour l&apos;instant</p>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            Ajoutez vos contenus types : présentation entreprise, moyens humains et matériels,
            méthodologie, références chantiers, certifications...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.value}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {group.label}
                <span className="text-xs text-gray-400 font-normal">
                  ({group.blocks.length})
                </span>
              </h2>
              <div className="space-y-2">
                {group.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="bg-white rounded-xl border border-gray-200 px-5 py-4 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {block.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-3 whitespace-pre-wrap">
                          {block.content}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(block.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
