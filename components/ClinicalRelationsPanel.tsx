'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, Link2, ShieldCheck } from 'lucide-react';
import {
  ClinicalRelation,
  getClinicalEntity,
  getClinicalRelations,
} from '@/data/clinicalRegistry';
import { Language } from '@/types/pharmacy';
import { ClinicalGraphPanel } from './ClinicalGraphPanel';
import {
  ClinicalRelationReviewMap,
  getClinicalRelationReviewEventName,
  getClinicalRelationReviews,
} from '@/lib/clinicalRelationReview';

interface ClinicalRelationsPanelProps {
  entityId: string;
  language: Language;
  onOpenTriage?: (scenarioId: string) => void;
  onOpenDisease?: (diseaseId: string) => void;
  onOpenEntity?: (entity: ReturnType<typeof getClinicalEntity>) => void;
}

const labels = {
  fa: {
    title: 'ارتباطات بالینی',
    subtitle: 'پیوندهای مرتبط و قابل اتکا',
    verified: 'ارتباط تأییدشده',
    triage: 'سناریوی تریاژ',
    product: 'محصول Shelf',
    disease: 'بیماری',
    concept: 'نکته بالینی',
    mechanism: 'مکانیسم دارویی',
    medicine: 'دارو',
    open: 'باز کردن',
    accepted: 'تأییدشده در بازبینی',
  },
  en: {
    title: 'Clinical connections',
    subtitle: 'Reliable related learning links',
    verified: 'Verified relation',
    triage: 'Triage scenario',
    product: 'Shelf product',
    disease: 'Disease',
    concept: 'Clinical concept',
    mechanism: 'Drug mechanism',
    medicine: 'Medicine',
    open: 'Open',
    accepted: 'Approved in review',
  },
} as const;

function relationLabel(type: string, language: Language) {
  const fa = language === 'fa';
  if (type === 'triages' || type === 'conversation-about') return fa ? labels.fa.triage : labels.en.triage;
  if (type === 'has-product' || type === 'used-for') return fa ? labels.fa.product : labels.en.product;
  if (type === 'explains') return fa ? labels.fa.concept : labels.en.concept;
  if (type === 'involves-medicine') return fa ? labels.fa.medicine : labels.en.medicine;
  return fa ? labels.fa.disease : labels.en.disease;
}

export function ClinicalRelationsPanel({ entityId, language, onOpenTriage, onOpenDisease, onOpenEntity }: ClinicalRelationsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [reviews, setReviews] = useState<ClinicalRelationReviewMap>({});
  const isFa = language === 'fa';
  const text = isFa ? labels.fa : labels.en;
  useEffect(() => {
    const refresh = () => setReviews(getClinicalRelationReviews());
    refresh();
    window.addEventListener(getClinicalRelationReviewEventName(), refresh);
    return () => window.removeEventListener(getClinicalRelationReviewEventName(), refresh);
  }, []);
  const relations = useMemo(
    () => getClinicalRelations(entityId).filter((relation) => relation.confidence === 'verified' || reviews[relation.id] === 'accepted'),
    [entityId, reviews]
  );
  const visibleRelations = relations.slice(0, 12);

  if (relations.length === 0) return null;

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] shadow-sm overflow-hidden" aria-label={text.title}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-3.5 sm:px-4 py-3 text-start hover:bg-violet-500/[0.08] transition"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-500 dark:text-violet-300 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs sm:text-sm font-black text-violet-900 dark:text-violet-200 truncate">{text.title}</span>
            <span className="block text-[10px] sm:text-xs text-violet-700/80 dark:text-violet-300/70 truncate">{text.subtitle} · {relations.length}</span>
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-violet-500 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-3.5 sm:px-4 pb-3.5 space-y-2 border-t border-violet-500/15 pt-2.5">
          <ClinicalGraphPanel entityId={entityId} language={language} onOpenEntity={(id) => {
            const entity = getClinicalEntity(id);
            if (entity) onOpenEntity?.(entity);
          }} />
          {visibleRelations.map((relation) => {
            const relatedId = relation.fromId === entityId ? relation.toId : relation.fromId;
            const entity = getClinicalEntity(relatedId);
            if (!entity) return null;
            const title = isFa ? entity.title.fa : entity.title.en;
            const isAcceptedSuggestion = relation.confidence === 'suggested';
            const isTriage = entity.type === 'triage-scenario';
            const isDisease = entity.type === 'disease';
            return (
              <div key={relation.id} className="flex items-start gap-2 rounded-xl app-bg border app-border px-2.5 py-2.5">
                <span className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isAcceptedSuggestion ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300">{relationLabel(relation.type, language)}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${isAcceptedSuggestion ? 'text-sky-700 dark:text-sky-300 border-sky-500/30 bg-sky-500/10' : 'text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10'}`}>
                      {isAcceptedSuggestion ? text.accepted : text.verified}
                    </span>
                  </div>
                  {onOpenEntity ? (
                    <button type="button" onClick={() => onOpenEntity(entity)} className="text-xs sm:text-sm font-black app-text leading-snug mt-0.5 text-start hover:text-violet-600 dark:hover:text-violet-300 transition" dir="auto">{title}</button>
                  ) : (
                    <div className="text-xs sm:text-sm font-black app-text leading-snug mt-0.5" dir="auto">{title}</div>
                  )}
                </div>
                {isTriage && onOpenTriage && (
                  <button
                    type="button"
                    onClick={() => onOpenTriage(entity.sourceId)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-black text-violet-700 dark:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 transition"
                  >
                    {text.open}<ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
                {isDisease && onOpenDisease && (
                  <button
                    type="button"
                    onClick={() => onOpenDisease(entity.sourceId)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-black text-violet-700 dark:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 transition"
                  >
                    {text.open}<ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
                {onOpenEntity && !isDisease && !isTriage && (
                  <button type="button" onClick={() => onOpenEntity(entity)} className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-black text-violet-700 dark:text-violet-200 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 transition">
                    {text.open}<ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          {relations.length > visibleRelations.length && (
            <div className="text-center text-[10px] text-violet-700/70 dark:text-violet-300/70 pt-1">
              +{relations.length - visibleRelations.length} {isFa ? 'ارتباط دیگر' : 'more connections'}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
