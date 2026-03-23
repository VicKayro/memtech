'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { GeneratedSection } from '@/types';

interface PlaceholderItem {
  text: string;
  type: 'complete' | 'verify';
  sectionTitle: string;
  sectionOrder: number;
}

interface BriefSheetProps {
  sections: GeneratedSection[];
}

export default function BriefSheet({ sections }: BriefSheetProps) {
  const [expanded, setExpanded] = useState(false);

  // Scan all generated sections for placeholders
  const items: PlaceholderItem[] = [];

  for (const section of sections) {
    if (!section.content) continue;

    // Match [À COMPLÉTER], [À COMPLÉTER PAR L'ENTREPRISE], [NOM À CONFIRMER], etc.
    const completeMatches = section.content.matchAll(
      /\[À COMPLÉTER[^\]]*\]|\[NOM À CONFIRMER\]|\[NOM À COMPLÉTER\]/gi
    );
    for (const match of completeMatches) {
      items.push({
        text: match[0],
        type: 'complete',
        sectionTitle: section.title,
        sectionOrder: section.section_order,
      });
    }

    // Match [À VÉRIFIER ...] placeholders
    const verifyMatches = section.content.matchAll(/\[À VÉRIFIER[^\]]*\]/gi);
    for (const match of verifyMatches) {
      items.push({
        text: match[0],
        type: 'verify',
        sectionTitle: section.title,
        sectionOrder: section.section_order,
      });
    }
  }

  if (items.length === 0) {
    return (
      <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium text-green-900">
            Aucun placeholder restant — le mémoire est complet
          </span>
        </div>
      </div>
    );
  }

  // Group by section
  const grouped = new Map<string, PlaceholderItem[]>();
  for (const item of items) {
    const key = `${item.sectionOrder}. ${item.sectionTitle}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const completeCount = items.filter((i) => i.type === 'complete').length;
  const verifyCount = items.filter((i) => i.type === 'verify').length;

  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="font-medium text-amber-900">
            Brief Sheet — {items.length} élément{items.length > 1 ? 's' : ''} à traiter
          </span>
          <span className="text-xs text-amber-600 ml-2">
            {completeCount > 0 && `${completeCount} à compléter`}
            {completeCount > 0 && verifyCount > 0 && ' · '}
            {verifyCount > 0 && `${verifyCount} à vérifier`}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {Array.from(grouped.entries())
            .sort(([, a], [, b]) => a[0].sectionOrder - b[0].sectionOrder)
            .map(([sectionKey, sectionItems]) => (
              <div key={sectionKey}>
                <h4 className="text-sm font-semibold text-amber-900 mb-1">
                  {sectionKey}
                </h4>
                <ul className="space-y-1">
                  {sectionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.type === 'complete'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {item.type === 'complete' ? 'COMPLÉTER' : 'VÉRIFIER'}
                      </span>
                      <span className="text-amber-800 font-mono text-xs">
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
