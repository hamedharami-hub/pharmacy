'use client';

import React, { useState } from 'react';
import { DISEASE_CATEGORIES, DISEASES_REGISTRY, DiseaseInfo, DiseaseCategory } from '@/data/diseasesRegistry';
import { Language } from '@/types/pharmacy';
import { useStudyTrackerContext } from './study/StudyTrackerContext';
import { StudyStatusBadge } from './study/StudyStatusBadge';
import {
  Search,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Pill,
  CheckCircle2,
  Filter,
  ShieldAlert,
  ArrowRight,
  Heart,
  Brain,
  Wind,
  Activity,
  Zap,
  Eye,
  User,
} from 'lucide-react';

interface DiseaseCategoryExplorerProps {
  language: Language;
  onSelectDisease: (disease: DiseaseInfo) => void;
  titleOverride?: string;
  subtitleOverride?: string;
}

export const DiseaseCategoryExplorer: React.FC<DiseaseCategoryExplorerProps> = ({
  language,
  onSelectDisease,
  titleOverride,
}) => {
  const isFa = language === 'fa';
  const { markItemViewed, toggleItemCompleted, isViewed, isCompleted } = useStudyTrackerContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Icon mapping helper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wind':
        return <Wind className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Activity':
        return <Activity className="w-3.5 h-3.5 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'Zap':
        return <Zap className="w-3.5 h-3.5 text-purple-400" />;
      case 'Heart':
        return <Heart className="w-3.5 h-3.5 text-sky-400" />;
      case 'Brain':
        return <Brain className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />;
      case 'Eye':
        return <Eye className="w-3.5 h-3.5 text-cyan-400" />;
      case 'User':
        return <User className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  // Filter diseases based on selected category & search query
  const filteredDiseases = DISEASES_REGISTRY.filter((d) => {
    if (selectedCategory !== 'ALL' && d.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const faName = d.name.fa.toLowerCase();
      const enName = d.name.en.toLowerCase();
      const overviewFa = d.overview.fa.toLowerCase();
      const overviewEn = d.overview.en.toLowerCase();
      const syns = d.synonyms.join(' ').toLowerCase();

      return (
        faName.includes(q) ||
        enName.includes(q) ||
        overviewFa.includes(q) ||
        overviewEn.includes(q) ||
        syns.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="rounded-2xl border app-border app-card p-4 sm:p-5 shadow-md space-y-4 animate-fadeIn">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b app-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/25 shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold app-text">
            {titleOverride || (isFa ? 'فهرست و راهنمای درمان بالینی بیماری‌ها' : 'Clinical Diseases & Treatment Guide')}
          </h3>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>{isExpanded ? (isFa ? 'بستن' : 'Collapse') : (isFa ? 'نمایش' : 'Expand')}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* Controls: Search and Categories */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute right-3 rtl:right-3 rtl:left-auto left-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? 'جستجوی نام بیماری (مثلاً آسم، ریفلاکس، اگزما، میگرن)...'
                    : 'Search condition (e.g., Asthma, GERD, Eczema, Migraine)...'
                }
                className="w-full pr-9 pl-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700/60 text-xs app-text placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {isFa ? 'همه' : 'All'}
              </button>

              {DISEASE_CATEGORIES.map((cat) => {
                const isSel = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {renderCategoryIcon(cat.iconName)}
                    <span>{cat.name[language] || cat.name.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diseases Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
            {filteredDiseases.length > 0 ? (
              filteredDiseases.map((d) => {
                const cat = DISEASE_CATEGORIES.find((c) => c.id === d.categoryId) || DISEASE_CATEGORIES[0];
                const viewed = isViewed(d.id);
                const completed = isCompleted(d.id);

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      markItemViewed(
                        4,
                        d.id,
                        { fa: d.name.fa || d.name.en, en: d.name.en || d.name.fa },
                        { fa: cat.name.fa || cat.name.en, en: cat.name.en || cat.name.fa },
                        { tabId: 'diseases', categoryId: d.categoryId }
                      );
                      onSelectDisease(d);
                    }}
                    className={`group p-3 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border transition cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden shadow-sm ${
                      completed ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'app-border hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-mono text-indigo-500 dark:text-indigo-400 font-bold truncate">
                          {cat.name[language] || cat.name.en}
                        </span>
                        <div className="flex items-center gap-1">
                          <StudyStatusBadge
                            language={language}
                            viewed={viewed}
                            completed={completed}
                            size="sm"
                            onToggleComplete={(e) => {
                              e.stopPropagation();
                              toggleItemCompleted(
                                4,
                                d.id,
                                { fa: d.name.fa || d.name.en, en: d.name.en || d.name.fa },
                                { fa: cat.name.fa || cat.name.en, en: cat.name.en || cat.name.fa }
                              );
                            }}
                          />
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[9px] border border-indigo-500/20 font-bold">
                            {isFa ? 'راهنما' : 'Guide'}
                          </span>
                        </div>
                      </div>

                      <div className="font-bold text-xs app-text group-hover:text-indigo-500 transition line-clamp-1">
                        {d.name[language] || d.name.en}
                      </div>

                      <p className="text-[11px] app-muted line-clamp-2 leading-relaxed">
                        {d.overview[language] || d.overview.en}
                      </p>
                    </div>

                    <div className="pt-2 border-t app-border flex items-center justify-between text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        <span>{isFa ? 'مشاهده درمان' : 'View Protocol'}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-6 text-center text-xs app-muted bg-slate-950/20 rounded-xl border app-border">
                {isFa ? 'هیچ بیماری مطابق با عبارت جستجو یافت نشد.' : 'No matching diseases found.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
