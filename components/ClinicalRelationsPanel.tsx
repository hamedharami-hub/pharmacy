'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BookOpenText, Link2, Pill } from 'lucide-react';
import {
  ClinicalEntity,
  ClinicalRelation,
  getClinicalEntity,
  getClinicalRelations,
} from '@/data/clinicalRegistry';
import { Language } from '@/types/pharmacy';
import {
  ClinicalRelationReviewMap,
  getClinicalRelationReviewEventName,
  getClinicalRelationReviews,
} from '@/lib/clinicalRelationReview';

interface ClinicalRelationsPanelProps {
  entityId: string;
  language: Language;
  onOpenDisease?: (diseaseId: string) => void;
  onOpenEntity?: (entity: ClinicalEntity) => void;
}

type MedicineRow = {
  id: string;
  genericName: string;
  genericEntity?: ClinicalEntity;
  brands: Array<{ id: string; name: string; entity: ClinicalEntity }>;
};

const labels = {
  fa: {
    title: 'داروها و نکات بالینی مرتبط',
    subtitle: 'فقط پیوندهای منبع‌دار یا تأییدشده در بازبینی',
    generic: 'ژنریک',
    brands: 'نام تجاری',
    notes: 'نکات بالینی مرتبط',
    noBrands: 'محصول مشخصی ثبت نشده است',
  },
  en: {
    title: 'Related medicines and clinical notes',
    subtitle: 'Only source-backed or review-approved links',
    generic: 'Generic',
    brands: 'Brand',
    notes: 'Related clinical notes',
    noBrands: 'No specific product recorded',
  },
} as const;

function getRelatedEntity(relation: ClinicalRelation, entityId: string) {
  return getClinicalEntity(relation.fromId === entityId ? relation.toId : relation.fromId);
}

function titleFor(entity: ClinicalEntity, language: Language) {
  return language === 'fa' ? entity.title.fa : entity.title.en;
}

export function ClinicalRelationsPanel({ entityId, language, onOpenDisease, onOpenEntity }: ClinicalRelationsPanelProps) {
  const [reviews, setReviews] = useState<ClinicalRelationReviewMap>({});
  const isFa = language === 'fa';
  const text = isFa ? labels.fa : labels.en;

  useEffect(() => {
    const refresh = () => setReviews(getClinicalRelationReviews());
    refresh();
    window.addEventListener(getClinicalRelationReviewEventName(), refresh);
    return () => window.removeEventListener(getClinicalRelationReviewEventName(), refresh);
  }, []);

  const visibleRelations = useMemo(
    () => getClinicalRelations(entityId).filter(
      (relation) => relation.confidence === 'verified' || reviews[relation.id] === 'accepted'
    ),
    [entityId, reviews]
  );

  const { medicines, notes } = useMemo(() => {
    const medicineRows = new Map<string, MedicineRow>();
    const noteRows = new Map<string, ClinicalEntity>();

    visibleRelations.forEach((relation) => {
      const entity = getRelatedEntity(relation, entityId);
      if (!entity || entity.type === 'triage-scenario') return;

      if (entity.type === 'medicine' || entity.type === 'product') {
        const medicineId = entity.type === 'medicine'
          ? entity.id
          : String(entity.metadata?.medicineId || entity.id);
        const canonicalMedicine = getClinicalEntity(medicineId);
        const genericName = canonicalMedicine
          ? titleFor(canonicalMedicine, language)
          : String(entity.metadata?.genericName || titleFor(entity, language));
        const row = medicineRows.get(medicineId) || {
          id: medicineId,
          genericName,
          genericEntity: canonicalMedicine,
          brands: [],
        };

        if (entity.type === 'product' && !row.brands.some((brand) => brand.id === entity.id)) {
          row.brands.push({ id: entity.id, name: titleFor(entity, language), entity });
        }
        medicineRows.set(medicineId, row);
        return;
      }

      noteRows.set(entity.id, entity);
    });

    return {
      medicines: Array.from(medicineRows.values()),
      notes: Array.from(noteRows.values()).slice(0, 8),
    };
  }, [entityId, language, visibleRelations]);

  if (medicines.length === 0 && notes.length === 0) return null;

  const openEntity = (entity: ClinicalEntity) => {
    if (entity.type === 'disease' && onOpenDisease) {
      onOpenDisease(entity.sourceId);
      return;
    }
    onOpenEntity?.(entity);
  };

  return (
    <section className="rounded-2xl app-card border app-border p-3.5 sm:p-4 shadow-sm space-y-3" aria-label={text.title}>
      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-black app-text">{text.title}</h2>
          <p className="text-[10px] sm:text-xs app-muted mt-0.5">{text.subtitle}</p>
        </div>
      </div>

      {medicines.length > 0 && (
        <div className="rounded-xl border app-border overflow-hidden">
          <div className="grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1.4fr)] gap-3 px-3 py-2 bg-black/[0.025] dark:bg-white/[0.025] text-[10px] font-bold app-muted">
            <span className="flex items-center gap-1"><Pill className="w-3 h-3" />{text.generic}</span>
            <span>{text.brands}</span>
          </div>
          <div className="divide-y app-border">
            {medicines.map((medicine) => (
              <div key={medicine.id} className="grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1.4fr)] gap-3 px-3 py-2.5 items-center">
                {medicine.genericEntity && onOpenEntity ? (
                  <button type="button" onClick={() => openEntity(medicine.genericEntity!)} className="text-start text-xs sm:text-sm font-black app-text hover:text-violet-600 dark:hover:text-violet-300 transition" dir="auto">
                    {medicine.genericName}
                  </button>
                ) : (
                  <span className="text-xs sm:text-sm font-black app-text" dir="auto">{medicine.genericName}</span>
                )}
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {medicine.brands.length > 0 ? medicine.brands.map((brand) => (
                    onOpenEntity ? (
                      <button key={brand.id} type="button" onClick={() => openEntity(brand.entity)} className="rounded-lg border app-border px-2 py-1 text-[10px] sm:text-xs app-text hover:border-violet-400/60 hover:text-violet-600 dark:hover:text-violet-300 transition" dir="auto">
                        {brand.name}
                      </button>
                    ) : (
                      <span key={brand.id} className="rounded-lg border app-border px-2 py-1 text-[10px] sm:text-xs app-text" dir="auto">{brand.name}</span>
                    )
                  )) : <span className="text-[10px] app-muted">{text.noBrands}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className={medicines.length > 0 ? 'border-t app-border pt-3' : ''}>
          <h3 className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black app-text mb-2">
            <BookOpenText className="w-3.5 h-3.5 text-violet-500" /> {text.notes}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {notes.map((entity) => (
              onOpenEntity || (entity.type === 'disease' && onOpenDisease) ? (
                <button key={entity.id} type="button" onClick={() => openEntity(entity)} className="inline-flex items-center gap-1 rounded-lg border app-border px-2.5 py-1.5 text-[10px] sm:text-xs font-bold app-text hover:border-violet-400/60 hover:text-violet-600 dark:hover:text-violet-300 transition" dir="auto">
                  {titleFor(entity, language)} <ArrowUpRight className="w-3 h-3" />
                </button>
              ) : (
                <span key={entity.id} className="rounded-lg border app-border px-2.5 py-1.5 text-[10px] sm:text-xs font-bold app-text" dir="auto">{titleFor(entity, language)}</span>
              )
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
