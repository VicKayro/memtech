'use client';

import { useState } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import FileUpload from '@/components/file-upload';

interface ImportResult {
  name: string;
  status: 'pending' | 'parsing' | 'segmenting' | 'ok' | 'error';
  blocks_count?: number;
  error?: string;
}

interface Props {
  onClose: () => void;
  onImportComplete: () => void;
}

export default function KnowledgeImportModal({ onClose, onImportComplete }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [done, setDone] = useState(false);

  const handleFilesChange = (newFiles: File[]) => {
    // Limit to 5 files
    setFiles(newFiles.slice(0, 5));
  };

  const handleImport = async () => {
    if (files.length === 0) return;
    setImporting(true);
    setDone(false);

    // Initialize results
    const initial: ImportResult[] = files.map((f) => ({
      name: f.name,
      status: 'pending',
    }));
    setResults(initial);

    // Dynamically import the client-side parser
    const { parseFileClientSide } = await import('@/lib/client-parsers');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Step 1: Parse client-side
      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'parsing' } : r))
      );

      let content: string;
      try {
        content = await parseFileClientSide(file, () => {});
        if (!content.trim()) throw new Error('Aucun texte extrait');
      } catch (err) {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: 'error', error: err instanceof Error ? err.message : 'Erreur de parsing' }
              : r
          )
        );
        continue;
      }

      // Step 2: Call segmentation API
      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'segmenting' } : r))
      );

      try {
        const res = await fetch('/api/knowledge/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, content }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Erreur serveur');

        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'ok', blocks_count: data.blocks_count } : r
          )
        );
      } catch (err) {
        setResults((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? { ...r, status: 'error', error: err instanceof Error ? err.message : 'Erreur' }
              : r
          )
        );
      }
    }

    setImporting(false);
    setDone(true);
    onImportComplete();
  };

  const totalBlocks = results.reduce((sum, r) => sum + (r.blocks_count ?? 0), 0);
  const successCount = results.filter((r) => r.status === 'ok').length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Importer des mémoires techniques
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Déposez 1 à 5 anciens mémoires techniques (PDF, DOCX). L&apos;IA en extraira
          automatiquement les blocs de connaissance réutilisables : style de rédaction,
          méthodologie, moyens, références...
        </p>

        {!importing && !done && (
          <>
            <FileUpload
              files={files}
              onFilesChange={handleFilesChange}
            />
            {files.length > 5 && (
              <p className="text-xs text-red-500 mt-1">Maximum 5 fichiers</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={files.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                Lancer l&apos;import
              </button>
            </div>
          </>
        )}

        {/* Progress / Results */}
        {(importing || done) && (
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex-shrink-0">
                  {r.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                  )}
                  {(r.status === 'parsing' || r.status === 'segmenting') && (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  {r.status === 'ok' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {r.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-500">
                    {r.status === 'pending' && 'En attente...'}
                    {r.status === 'parsing' && 'Extraction du texte...'}
                    {r.status === 'segmenting' && 'Segmentation IA en cours...'}
                    {r.status === 'ok' && `${r.blocks_count} blocs extraits`}
                    {r.status === 'error' && (
                      <span className="text-red-500">{r.error}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}

            {done && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {totalBlocks} blocs extraits de {successCount} document{successCount > 1 ? 's' : ''}
                </p>
                <button
                  onClick={onClose}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
