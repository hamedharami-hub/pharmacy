'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, ExternalLink, Link2, RotateCcw, X, XCircle } from 'lucide-react';
import { Language } from '@/types/pharmacy';
import { getClinicalEntity, getClinicalRelations, ClinicalRelation } from '@/data/clinicalRegistry';
import {
  clearClinicalRelationReview,
  ClinicalRelationReviewMap,
  getClinicalRelationReviews,
  getClinicalRelationReviewEventName,
  getSuggestedClinicalRelations,
  saveClinicalRelationReview,
} from '@/lib/clinicalRelationReview';

interface ClinicalRelationsReviewPanelProps { language: Language }

export function ClinicalRelationsReviewPanel({ language }: ClinicalRelationsReviewPanelProps) {
  const isFa = language === 'fa';
  const [reviews, setReviews] = useState<ClinicalRelationReviewMap>({});
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    const refresh = () => setReviews(getClinicalRelationReviews());
    refresh();
    window.addEventListener(getClinicalRelationReviewEventName(), refresh);
    return () => window.removeEventListener(getClinicalRelationReviewEventName(), refresh);
  }, []);

  const suggestions = useMemo(() => getSuggestedClinicalRelations().filter((relation) => {
    const status = reviews[relation.id];
    return filter === 'all' || (filter === 'pending' && !status) || status === filter;
  }), [filter, reviews]);
  const counts = useMemo(() => {
    const all = getSuggestedClinicalRelations();
    return {
      pending: all.filter((r) => !reviews[r.id]).length,
      accepted: all.filter((r) => reviews[r.id] === 'accepted').length,
      rejected: all.filter((r) => reviews[r.id] === 'rejected').length,
      all: all.length,
    };
  }, [reviews]);

  const copy = isFa
    ? { title: 'بازبینی ارتباطات پیشنهادی', intro: 'ارتباط‌هایی را که سیستم از تطبیق متن پیشنهاد داده، تأیید یا رد کنید. این تصمیم فقط در دستگاه فعلی ذخیره می‌شود.', pending: 'در انتظار', accepted: 'تأییدشده', rejected: 'ردشده', all: 'همه', accept: 'تأیید', reject: 'رد', restore: 'بازگردانی', noItems: 'موردی در این فیلتر وجود ندارد.', disease: 'بیماری', triage: 'تریاژ', product: 'محصول', reason: 'دلیل پیشنهاد' }
    : { title: 'Review suggested clinical relations', intro: 'Approve or reject links inferred from text matching. Decisions are stored locally on this device.', pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected', all: 'All', accept: 'Accept', reject: 'Reject', restore: 'Restore', noItems: 'No relations in this filter.', disease: 'Disease', triage: 'Triage', product: 'Product', reason: 'Suggestion reason' };

  const entityTitle = (id: string) => {
    const entity = getClinicalEntity(id);
    return entity ? (isFa ? entity.title.fa : entity.title.en) : id;
  };
  const entityType = (id: string) => {
    const type = getClinicalEntity(id)?.type;
    if (type === 'disease') return copy.disease;
    if (type === 'triage-scenario') return copy.triage;
    if (type === 'product') return copy.product;
    return type || '';
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-3.5 sm:p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-black text-sm">
          <Link2 className="w-4 h-4" />
          <h2>{copy.title}</h2>
        </div>
        <p className="text-[11px] sm:text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/75">{copy.intro}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['pending', 'accepted', 'rejected', 'all'] as const).map((key) => (
          <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-xl border px-2.5 py-2 text-start transition ${filter === key ? 'border-sky-500 bg-sky-500/15 ring-1 ring-sky-500/30' : 'app-border app-bg hover:border-sky-500/40'}`}>
            <span className="block text-[10px] app-muted font-bold">{copy[key]}</span>
            <span className="block text-base font-black app-text mt-0.5">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {suggestions.map((relation: ClinicalRelation) => {
          const status = reviews[relation.id];
          return (
            <article key={relation.id} className="rounded-2xl app-bg border app-border p-3 sm:p-3.5 space-y-3">
              <div className="flex items-start gap-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${status === 'accepted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : status === 'rejected' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'}`}>
                  {status === 'accepted' ? <CheckCircle2 className="w-4 h-4" /> : status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] app-muted font-bold">
                    <span>{entityType(relation.fromId)}</span><span>→</span><span>{relation.type}</span><span>→</span><span>{entityType(relation.toId)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-1.5 items-center mt-1 text-xs sm:text-sm font-black app-text">
                    <span dir="auto">{entityTitle(relation.fromId)}</span><span className="hidden sm:block text-sky-500 text-center">→</span><span dir="auto">{entityTitle(relation.toId)}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/15 px-2.5 py-2 text-[10px] leading-relaxed text-amber-800/80 dark:text-amber-100/70"><b>{copy.reason}:</b> {relation.reason || relation.source}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => saveClinicalRelationReview(relation.id, 'accepted')} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black bg-emerald-600 text-white hover:bg-emerald-500 transition"><Check className="w-3.5 h-3.5" />{copy.accept}</button>
                <button type="button" onClick={() => saveClinicalRelationReview(relation.id, 'rejected')} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black bg-rose-600 text-white hover:bg-rose-500 transition"><X className="w-3.5 h-3.5" />{copy.reject}</button>
                {status && <button type="button" onClick={() => clearClinicalRelationReview(relation.id)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold app-bg app-text border app-border hover:border-sky-500/50 transition"><RotateCcw className="w-3.5 h-3.5" />{copy.restore}</button>}
              </div>
            </article>
          );
        })}
        {suggestions.length === 0 && <div className="rounded-2xl border app-border app-bg p-6 text-center text-xs app-muted">{copy.noItems}</div>}
      </div>
    </div>
  );
}
