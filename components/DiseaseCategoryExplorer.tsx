'use client';

import React, { useState } from 'react';
import { DISEASE_CATEGORIES, DISEASES_REGISTRY, DiseaseInfo } from '@/data/diseasesRegistry';
import { Language } from '@/types/pharmacy';
import { useStudyTrackerContext } from './study/StudyTrackerContext';
import { StudyStatusBadge } from './study/StudyStatusBadge';
import {
  Search,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Pill,
  ShieldAlert,
  ArrowRight,
  Heart,
  Brain,
  Wind,
  Activity,
  Zap,
  Eye,
  User,
  Layers,
  FolderOpen,
  X,
} from 'lucide-react';

interface DiseaseCategoryExplorerProps {
  language: Language;
  onSelectDisease: (disease: DiseaseInfo) => void;
  titleOverride?: string;
  subtitleOverride?: string;
  onNavigateToModule?: (moduleNumber: 1 | 2 | 3 | 4 | 5 | 6, contextId?: string) => void;
  onOpenAiLeitner?: (text: string, module: 1 | 2 | 4, category?: string, topic?: string) => void;
}

export const DiseaseCategoryExplorer: React.FC<DiseaseCategoryExplorerProps> = ({
  language,
  onSelectDisease,
  titleOverride,
  subtitleOverride,
}) => {
  const isFa = language === 'fa';
  const { markItemViewed, toggleItemCompleted, isViewed, isCompleted } = useStudyTrackerContext();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Icon mapping helper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wind':
        return <Wind className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'Activity':
        return <Activity className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'Heart':
        return <Heart className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'Brain':
        return <Brain className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0" />;
      case 'Eye':
        return <Eye className="w-4 h-4 text-cyan-400 shrink-0" />;
      case 'User':
        return <User className="w-4 h-4 text-pink-400 shrink-0" />;
      default:
        return <Stethoscope className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  const activeCategory =
    selectedCategoryId === 'ALL'
      ? null
      : DISEASE_CATEGORIES.find((c) => c.id === selectedCategoryId) || null;

  // Filter diseases based on selected category & search query
  const filteredDiseases = DISEASES_REGISTRY.filter((d) => {
    if (selectedCategoryId !== 'ALL' && d.categoryId !== selectedCategoryId) return false;
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
    <div className="space-y-4 animate-fadeIn">
      {/* 1. TOP SELECTOR CARD: Exactly like Shelf Domain Selector */}
      <div className="app-card border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg bg-linear-to-b from-emerald-950/20 to-transparent">
        <div className="border-b app-border pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black app-text">
                {titleOverride || (isFa ? 'انتخاب دسته‌بندی بالینی بیماری‌ها' : 'Select Clinical Disease Category')}
              </h3>
              <p className="text-[11px] app-muted">
                {subtitleOverride || (isFa ? 'برای مشاهده پروتکل‌های درمانی و داروها، دسته‌بندی مورد نظر را انتخاب کنید.' : 'Choose a category to browse conditions and protocols.')}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            {filteredDiseases.length} {isFa ? 'بیماری' : 'conditions'}
          </span>
        </div>

        {/* Real-time Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 rtl:right-3.5 rtl:left-auto left-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isFa
                ? 'جستجوی نام بیماری، علائم یا نام‌های رایج (مثلاً آسم، ریفلاکس، اگزما، میگرن)...'
                : 'Search conditions, symptoms or common names (e.g., Asthma, Reflux, Eczema)...'
            }
            className="w-full pr-10 pl-9 rtl:pr-10 rtl:pl-9 py-2.5 rounded-xl border app-border bg-black/40 text-xs app-text placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner transition"
          />
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 rtl:left-3 rtl:right-auto right-3 rtl:right-auto top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vertical Category Dropdown / Selector Button (Identical to ShelfDomainSelector) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFa ? 'سرفصل اصلی بالینی (Active Clinical Domain):' : 'Active Clinical Domain:'}</span>
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className="w-full p-3 rounded-xl bg-slate-950/80 border app-border hover:border-emerald-500/50 flex items-center justify-between text-xs font-bold app-text transition cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {activeCategory ? (
                  <>
                    <div className="p-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                      {renderCategoryIcon(activeCategory.iconName)}
                    </div>
                    <span className="truncate">{activeCategory.name[language] || activeCategory.name.en}</span>
                  </>
                ) : (
                  <>
                    <div className="p-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <span className="text-emerald-400 font-bold">{isFa ? 'همه دسته‌بندی‌ها (نمایش کلیه بیماری‌ها)' : 'All Categories (View All Diseases)'}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                {isCategoryDropdownOpen ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-30 space-y-1 max-h-72 overflow-y-auto custom-scrollbar animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('ALL');
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold text-right rtl:text-right ltr:text-left transition flex items-center justify-between cursor-pointer ${
                    selectedCategoryId === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>{isFa ? 'همه دسته‌بندی‌ها' : 'All Categories'}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80">{DISEASES_REGISTRY.length}</span>
                </button>

                {DISEASE_CATEGORIES.map((cat) => {
                  const isSel = selectedCategoryId === cat.id;
                  const catCount = DISEASES_REGISTRY.filter((d) => d.categoryId === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold text-right rtl:text-right ltr:text-left transition flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {renderCategoryIcon(cat.iconName)}
                        <span className="truncate">{cat.name[language] || cat.name.en}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">{catCount}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. DISEASES CARDS GRID (Directly clickable to study without nested traps) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-200">
              {isFa ? 'بیماری‌ها و پروتکل‌های بالینی:' : 'Clinical Conditions & Protocols:'}
            </h4>
          </div>
          <span className="text-[11px] app-muted font-mono">
            {filteredDiseases.length} {isFa ? 'مورد یافت شد' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                  className={`group p-4 rounded-2xl bg-slate-950/50 hover:bg-slate-900 border transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden shadow-sm hover:scale-[1.01] hover:border-emerald-500/60 ${
                    completed ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'app-border'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-mono text-emerald-400 font-bold truncate text-[10px]">
                        {cat.name[language] || cat.name.en}
                      </span>
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
                    </div>

                    <div className="font-black text-xs sm:text-sm text-slate-100 group-hover:text-emerald-400 transition line-clamp-1">
                      {d.name[language] || d.name.en}
                    </div>

                    <p className="text-[11px] app-muted line-clamp-2 leading-relaxed">
                      {d.overview[language] || d.overview.en}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isFa ? 'مطالعه ۳ فازی بیماری' : 'Study Condition'}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center text-xs app-muted bg-slate-950/20 rounded-2xl border app-border">
              {isFa ? 'هیچ بیماری مطابق با عبارت جستجو یافت نشد.' : 'No matching diseases found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
