'use client';

import React from 'react';
import { DiseaseInfo, DISEASE_CATEGORIES } from '@/data/diseasesRegistry';
import { Scenario } from '@/data/otcScenarios';
import { SpecialTriageCategory, hasTriageScenario, getScenariosForDisease } from '@/lib/diseaseTriageBridge';
import { Language } from '@/types/pharmacy';
import { useStudyTrackerContext } from '../study/StudyTrackerContext';
import { StudyStatusBadge } from '../study/StudyStatusBadge';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MessageSquareText,
  Scale,
  Search,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface UnifiedDiseaseExplorerProps {
  language: Language;
  diseases: DiseaseInfo[];
  specialCategory?: SpecialTriageCategory | null;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSelectDisease: (disease: DiseaseInfo) => void;
  onStartTriageForDisease: (disease: DiseaseInfo, scenario: Scenario) => void;
  onStartSpecialScenario: (scenario: Scenario) => void;
  onBrowseTriage?: () => void;
}

export const UnifiedDiseaseExplorer: React.FC<UnifiedDiseaseExplorerProps> = ({
  language,
  diseases,
  specialCategory,
  searchQuery,
  onSearchQueryChange,
  onSelectDisease,
  onStartTriageForDisease,
  onStartSpecialScenario,
  onBrowseTriage,
}) => {
  const isFa = language === 'fa';
  const { markItemViewed, toggleItemCompleted, isViewed, isCompleted } = useStudyTrackerContext();

  // If viewing a special category (Slang or Admin scenarios)
  if (specialCategory) {
    const scenarios = specialCategory.scenarios.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.title.en.toLowerCase().includes(q) ||
        s.title.fa.toLowerCase().includes(q) ||
        s.patientProfile.presentation.en.toLowerCase().includes(q) ||
        s.patientProfile.presentation.fa.toLowerCase().includes(q)
      );
    });

    const isSlang = specialCategory.id === 'special_slang';

    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={
              isFa
                ? `جستجو در سناریوهای ${specialCategory.name.fa}...`
                : `Search in ${specialCategory.name.en}...`
            }
            className="w-full h-11 ps-10 pe-9 rounded-2xl bg-black/5 dark:bg-slate-900/60 border app-border text-xs focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/60 transition outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Header summary */}
        <div className="app-card border border-amber-500/30 rounded-2xl p-4 bg-linear-to-r from-amber-500/10 via-amber-950/15 to-transparent flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            {isSlang ? <MessageSquareText className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black app-text">
              {isFa ? specialCategory.name.fa : specialCategory.name.en}
            </h3>
            <p className="text-xs app-muted mt-1 leading-relaxed">
              {isFa ? specialCategory.description.fa : specialCategory.description.en}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                {scenarios.length} {isFa ? 'سناریو' : 'scenarios'}
              </span>
            </div>
          </div>
        </div>

        {/* List of Scenarios */}
        <div className="space-y-3">
          {scenarios.length > 0 ? (
            scenarios.map((scenario) => {
              const studyId = `otc:${scenario.id}`;
              const viewed = isViewed(studyId);
              const completed = isCompleted(studyId);

              return (
                <div
                  key={scenario.id}
                  className={`group app-card border rounded-2xl p-3.5 sm:p-4 transition-all duration-200 bg-slate-900/90 text-white shadow-sm hover:shadow-md app-border hover:border-amber-500/40 ${
                    completed ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                          {isSlang ? <MessageSquareText className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
                          <span>{isSlang ? (isFa ? 'اصطلاحات عامیانه' : 'Slang') : (isFa ? 'قوانین و اخلاق' : 'Law & Ethics')}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {scenario.id}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition leading-snug">
                        {scenario.title[language] || scenario.title.en}
                      </h4>
                      <p className="text-xs app-muted" dir="ltr">
                        {scenario.title.en}
                      </p>
                    </div>

                    <StudyStatusBadge
                      language={language}
                      viewed={viewed}
                      completed={completed}
                      size="sm"
                      onToggleComplete={(e) => {
                        e.stopPropagation();
                        toggleItemCompleted(1, studyId, scenario.title, { fa: specialCategory.name.fa, en: specialCategory.name.en });
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 bg-black/20 p-2.5 rounded-xl border border-white/5 line-clamp-2 leading-relaxed mt-2.5">
                    <span className="font-bold text-amber-400 me-1">
                      {isFa ? 'شرح مراجعه:' : 'Presentation:'}
                    </span>
                    {scenario.patientProfile.presentation[language] || scenario.patientProfile.presentation.en}
                  </p>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-3">
                    <span className="text-[11px] app-muted">
                      {scenario.redFlags.length} {isFa ? 'پرچم قرمز' : 'Red flags'}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        haptic.medium();
                        onStartSpecialScenario(scenario);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{isFa ? 'شروع شبیه‌سازی تریاژ' : 'Start Simulation'}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs app-muted bg-slate-950/20 rounded-2xl border app-border">
              {isFa ? 'هیچ سناریویی مطابق با عبارت جستجو یافت نشد.' : 'No matching scenarios found.'}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Viewing Medical Diseases
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={
              isFa
                ? 'جستجوی بیماری، دارو یا علامت…'
                : 'Search disease, medicine or symptom…'
            }
            className="w-full h-11 ps-10 pe-9 rounded-2xl bg-black/5 dark:bg-slate-900/60 border app-border text-xs focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/60 transition outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {onBrowseTriage && (
          <button
            type="button"
            onClick={onBrowseTriage}
            className="h-11 shrink-0 px-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{isFa ? 'تریاژ' : 'Triage'}</span>
          </button>
        )}
      </div>

      {/* Disease Cards List */}
      <div className="space-y-3">
        {diseases.length > 0 ? (
          diseases.map((disease) => {
            const category =
              DISEASE_CATEGORIES.find((c) => c.id === disease.categoryId) || DISEASE_CATEGORIES[0];
            const hasTriage = hasTriageScenario(disease.id);
            const matchingScenarios = getScenariosForDisease(disease.id);
            const firstScenario = matchingScenarios[0] || null;

            const viewed = isViewed(disease.id);
            const completed = isCompleted(disease.id);

            const handleCardClick = () => {
              markItemViewed(
                1,
                disease.id,
                { fa: disease.name.fa || disease.name.en, en: disease.name.en || disease.name.fa },
                { fa: category.name.fa || category.name.en, en: category.name.en || category.name.fa },
                { tabId: 'diseases', categoryId: disease.categoryId }
              );
              onSelectDisease(disease);
            };

            return (
              <div
                key={disease.id}
                className={`group app-card border rounded-2xl p-3 sm:p-3.5 transition-all duration-200 bg-slate-900/90 text-white shadow-sm hover:shadow-md app-border hover:border-sky-500/40 ${
                  completed ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex text-[10px] px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono">
                        {category.name[language] || category.name.en}
                      </span>

                      {hasTriage && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs">
                          <Stethoscope className="w-3 h-3 text-emerald-400" />
                          <span>{isFa ? 'تریاژ دارد' : 'Triage available'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-sky-300 transition leading-snug pt-0.5" dir={isFa ? 'rtl' : 'ltr'}>
                      {disease.name[language] || disease.name.en}
                    </h3>
                    {isFa && disease.name.en && <p className="text-[11px] app-muted" dir="ltr">{disease.name.en}</p>}
                  </div>

                  <StudyStatusBadge
                    language={language}
                    viewed={viewed}
                    completed={completed}
                    size="sm"
                    onToggleComplete={(e) => {
                      e.stopPropagation();
                      toggleItemCompleted(
                        1,
                        disease.id,
                        { fa: disease.name.fa || disease.name.en, en: disease.name.en || disease.name.fa },
                        { fa: category.name.fa || category.name.en, en: category.name.en || category.name.fa }
                      );
                    }}
                  />
                </div>

                <div className={`grid gap-2 pt-3 border-t border-slate-800 mt-3 ${hasTriage && firstScenario ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <button
                    type="button"
                    onClick={handleCardClick}
                    className="min-w-0 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/25 font-bold flex items-center justify-center gap-1.5 text-[11px] transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isFa ? 'مطالعه راهنما' : 'Open guide'}</span>
                  </button>

                  {hasTriage && firstScenario && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic.medium();
                        onStartTriageForDisease(disease, firstScenario);
                      }}
                      className="min-w-0 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{isFa ? 'شروع تریاژ' : 'Start triage'}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs app-muted bg-slate-950/20 rounded-2xl border app-border">
            {isFa ? 'هیچ بیماری مطابق با فیلتر یا عبارت جستجو یافت نشد.' : 'No matching diseases found.'}
          </div>
        )}
      </div>
    </div>
  );
};
