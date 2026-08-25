'use client';

import React from 'react';
import { ClinicalDomain, SubCategory } from '@/types/shelf';
import { Language, DiseaseInfo } from '@/types/pharmacy';
import { FormattedClinicalText } from './FormattedClinicalText';
import { getDiseasesForSubCategory } from '@/data/shelf/diseaseHelpers';
import {
  Layers,
  ChevronDown,
  Check,
  BookOpen,
  Sparkles,
  Lightbulb,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Activity,
} from 'lucide-react';

interface ShelfSubcategoriesAccordionProps {
  activeDomain: ClinicalDomain;
  activeSubCat: SubCategory;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectSubCatId: (id: string) => void;
  onSelectDisease: (d: DiseaseInfo) => void;
  language: Language;
}

export const ShelfSubcategoriesAccordion: React.FC<ShelfSubcategoriesAccordionProps> = ({
  activeDomain,
  activeSubCat,
  isOpen,
  onToggleOpen,
  onSelectSubCatId,
  onSelectDisease,
  language,
}) => {
  const isFa = language === 'fa';
  const relatedDiseases = getDiseasesForSubCategory(activeSubCat.id);

  return (
    <div className="space-y-3">
      {/* ACCORDION 1: زیرمجموعه‌ها (Subcategories) */}
      <div className="app-card border app-border rounded-2xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          onClick={onToggleOpen}
          className="w-full p-3.5 sm:p-4 bg-slate-900/60 hover:bg-slate-900/80 flex items-center justify-between gap-3 text-right rtl:text-right cursor-pointer transition-colors border-b app-border"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {isFa ? 'زیرمجموعه‌های این دسته اصلی' : 'Clinical Subcategories'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold">
                  {activeDomain.subcategories.length} {isFa ? 'زیرمجموعه' : 'Subcategories'}
                </span>
              </div>
              <p className="text-[11px] text-sky-300/90 mt-0.5 font-medium">
                {isFa
                  ? `📂 زیرمجموعه فعال: ${activeSubCat.titleFa}`
                  : `📂 Active Subcategory: ${activeSubCat.titleEn}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-sky-400 hidden sm:inline">
              {isOpen
                ? isFa
                  ? 'بستن گزینه‌ها'
                  : 'Collapse'
                : isFa
                ? 'تغییر زیرمجموعه'
                : 'Change Subcategory'}
            </span>
            <div className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-sky-400' : ''
                }`}
              />
            </div>
          </div>
        </button>

        {isOpen && (
          <div className="p-3.5 sm:p-4 bg-slate-950/40 animate-fadeIn space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                {isFa ? 'یکی از زیرمجموعه‌های زیر را انتخاب نمایید:' : 'Select a clinical subcategory:'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isFa
                  ? 'داروهای این زیرمجموعه در پایین صفحه بارگذاری می‌شوند'
                  : 'Shelf products will update below'}
              </span>
            </div>

            {/* Wide and spacious subcategory selection grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {/* Subcategories list */}
              {activeDomain.subcategories.map((sub) => {
                const isSubSelected = sub.id === activeSubCat.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onSelectSubCatId(sub.id);
                    }}
                    className={`p-3 rounded-xl text-right rtl:text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSubSelected
                        ? 'bg-gradient-to-br from-sky-500/30 to-indigo-600/20 border-2 border-sky-400 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400/40 font-bold'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSubSelected
                          ? 'bg-sky-400 text-slate-950 font-black'
                          : 'bg-slate-800 text-sky-400'
                      }`}
                    >
                      {isSubSelected ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs leading-snug text-white">
                        {isFa ? sub.titleFa : sub.titleEn}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">
                        {isFa ? sub.titleEn : sub.titleFa}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* نکات بالینی و قوانین زمان‌بندی این زیرمجموعه - همیشه باز و مستقیم روی صفحه */}
      <div className="app-card border app-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm bg-slate-950/40 transition-all">
        <div className="flex items-center justify-between gap-3 border-b app-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>
                  {isFa
                    ? 'نکات بالینی، قوانین زمان‌بندی و علائم هشدار'
                    : 'Clinical Pearls, Scheduling Rules & Red Flags'}
                </span>
              </h3>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                {isFa
                  ? `مرتبط با: ${activeSubCat.titleFa}`
                  : `Focus: ${activeSubCat.titleEn}`}
              </p>
            </div>
          </div>
          <span className="text-xs text-sky-400 font-mono font-bold px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30">
            {activeSubCat.id}
          </span>
        </div>

        {/* Wide and readable columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 w-full">
          {/* 1. Clinical Pearls (6 cols on lg) */}
          <div className="col-span-1 lg:col-span-6 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between text-sky-300 font-bold text-xs sm:text-sm border-b border-sky-500/20 pb-2">
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                {isFa ? '💡 نکات کلیدی بالینی (Clinical Pearls)' : '💡 Clinical Pearls'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold">
                {(isFa ? activeSubCat.clinicalPearlsFa : activeSubCat.clinicalPearlsEn).length}{' '}
                {isFa ? 'مورد' : 'items'}
              </span>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-200">
              {(isFa ? activeSubCat.clinicalPearlsFa : activeSubCat.clinicalPearlsEn).map(
                (pearl, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-sky-500/20 flex items-start gap-2.5 leading-relaxed shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                    <div className="flex-1 leading-relaxed">
                      <FormattedClinicalText text={pearl} />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 2. Scheduling Rules (3 cols on lg) */}
          <div className="col-span-1 lg:col-span-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between text-indigo-300 font-bold text-xs sm:text-sm border-b border-indigo-500/20 pb-2">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                {isFa ? '🛡️ قوانین زمان‌بندی' : '🛡️ Scheduling Rules'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                SUSMP
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-xs">
              <FormattedClinicalText
                text={isFa ? activeSubCat.schedulingRulesFa : activeSubCat.schedulingRulesEn}
              />
            </div>
          </div>

          {/* 3. Red Flags (3 cols on lg) */}
          <div className="col-span-1 lg:col-span-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between text-rose-300 font-bold text-xs sm:text-sm border-b border-rose-500/20 pb-2">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {isFa ? '🚨 علائم هشدار و ارجاع' : '🚨 Red Flags'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
                {(isFa ? activeSubCat.redFlagsFa : activeSubCat.redFlagsEn).length}{' '}
                {isFa ? 'مورد' : 'flags'}
              </span>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-rose-200">
              {(isFa ? activeSubCat.redFlagsFa : activeSubCat.redFlagsEn).map((flag, idx) => (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3 rounded-xl bg-rose-950/40 border border-rose-500/25 flex items-start gap-2.5 leading-relaxed shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <div className="flex-1 leading-relaxed">
                    <FormattedClinicalText text={flag} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Diseases Banner */}
        {relatedDiseases.length > 0 && (
          <div className="pt-3 border-t app-border flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 shrink-0">
              <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isFa ? 'بیماری‌های مرتبط با این زیرمجموعه:' : 'Related Diseases:'}</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {relatedDiseases.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDisease(d)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] shadow-xs"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {isFa
                      ? d.name.fa.split('(')[0].trim()
                      : d.name.en.split('(')[0].trim()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
