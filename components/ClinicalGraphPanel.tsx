'use client';

import React, { useMemo } from 'react';
import { ArrowRight, Network } from 'lucide-react';
import { getClinicalEntity, getClinicalRelations } from '@/data/clinicalRegistry';
import { Language } from '@/types/pharmacy';

interface ClinicalGraphPanelProps {
  entityId: string;
  language: Language;
  onOpenEntity?: (entityId: string) => void;
}

export function ClinicalGraphPanel({ entityId, language, onOpenEntity }: ClinicalGraphPanelProps) {
  const isFa = language === 'fa';
  const links = useMemo(() => getClinicalRelations(entityId).slice(0, 8), [entityId]);
  const root = getClinicalEntity(entityId);
  if (!root || links.length === 0) return null;
  const rootTitle = isFa ? root.title.fa : root.title.en;

  return (
    <section className="rounded-2xl border border-sky-500/25 bg-sky-500/[0.04] p-3 space-y-2" aria-label={isFa ? 'نقشه ارتباطات' : 'Clinical relationship graph'}>
      <div className="flex items-center gap-2 text-[11px] font-black text-sky-700 dark:text-sky-300">
        <Network className="w-3.5 h-3.5" />
        {isFa ? 'نقشه ارتباطات' : 'Relationship map'}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="rounded-lg bg-sky-600 text-white px-2 py-1 font-black max-w-[45%] truncate" title={rootTitle}>{rootTitle}</span>
        {links.map((link) => {
          const relatedId = link.fromId === entityId ? link.toId : link.fromId;
          const related = getClinicalEntity(relatedId);
          if (!related) return null;
          const title = isFa ? related.title.fa : related.title.en;
          return (
            <React.Fragment key={link.id}>
              <ArrowRight className="w-3 h-3 text-sky-500 shrink-0 rtl:rotate-180" />
              <button type="button" onClick={() => onOpenEntity?.(related.id)} className="rounded-lg app-bg border app-border px-2 py-1 font-bold app-text max-w-[45%] truncate hover:border-sky-500/60 hover:text-sky-600 transition" title={title}>{title}</button>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
