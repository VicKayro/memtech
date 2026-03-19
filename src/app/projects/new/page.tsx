'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import FileUpload from '@/components/file-upload';
import StepIndicator from '@/components/step-indicator';
import { parseFileClientSide } from '@/lib/client-parsers';

export default function NewProject() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Donnez un nom au dossier');
      return;
    }
    if (files.length === 0) {
      setError('Ajoutez au moins un document');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 1. Create project
      setProgress('Création du dossier...');
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const project = await projRes.json();
      if (!projRes.ok) throw new Error(project.error);

      // 2. Parse files client-side (avoids Vercel body size limit)
      const documents: { name: string; content: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Extraction du texte : ${file.name} (${i + 1}/${files.length})...`);
        try {
          const content = await parseFileClientSide(file);
          if (content.trim().length === 0) {
            throw new Error('Aucun texte extrait (le fichier est peut-être un scan/image)');
          }
          documents.push({ name: file.name, content });
        } catch (err) {
          documents.push({
            name: file.name,
            content: `[ERREUR EXTRACTION: ${err instanceof Error ? err.message : 'Erreur'}]`,
          });
        }
      }

      // 3. Send extracted text to API (small JSON, no file size issue)
      setProgress('Enregistrement des documents...');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id, documents }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      // Check for errors
      const errors = uploadData.results.filter(
        (r: { status: string }) => r.status === 'error'
      );
      if (errors.length > 0 && errors.length === files.length) {
        throw new Error(`Tous les fichiers ont échoué : ${errors[0].error}`);
      }

      // 4. Navigate to analysis
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
      setUploading(false);
      setProgress('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator current={1} />

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Nouveau dossier d&apos;appel d&apos;offres
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Nommez votre dossier et déposez les pièces du marché.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du marché
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Réhabilitation école Jules Ferry — Lot 2 CVC"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Documents du dossier
            </label>
            <FileUpload files={files} onFilesChange={setFiles} />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress || 'Traitement en cours...'}
              </>
            ) : (
              <>
                Analyser le dossier
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
