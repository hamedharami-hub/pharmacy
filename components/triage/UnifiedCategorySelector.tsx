'use client';

import React, { useState } from 'react';
import { DISEASE_CATEGORIES, DISEASES_REGISTRY } from '@/data/diseasesRegistry';
import { SPECIAL_TRIAGE_CATEGORIES, hasTriageScenario } from '@/lib/diseaseTriageBridge';
import { getSubcategoriesForCategory } from '@/lib/diseaseSubcategories';
import { Language } from '@/types/pharmacy';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Brain,
  Check,
  Eye,
  FolderTree,
  Heart,
  MessageSquareText,
  Scale,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  User,
  Wind,
  Zap,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { StageSelectorCard } from '@/components/ui';

interface UnifiedCategorySelectorProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  selectedSubCatId: string;
  onSelectSubCat: (id: string) => void;
  triageOnly: boolean;
  onToggleTriageOnly: () => void;
  language: Language;
}

interface CategoryStyleConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  activeBorder: string;
  activeBg: string;
  badgeBg: string;
  badgeText: string;
}

export const UnifiedCategorySelector: React.FC<UnifiedCategorySelectorProps> = ({
  selectedCategoryId,
  onSelectCategory,
  selectedSubCatId,
  onSelectSubCat,
  triageOnly,
  onToggleTriageOnly,
  language,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFa = language === 'fa';

  const allCategory = {
    id: 'ALL',
    name: { fa: 'همه دسته‌بندی‌های بالینی', en: 'All Clinical Categories' },
    iconName: 'FolderTree',
  };

  const getCategoryStyle = (iconName: string): CategoryStyleConfig => {
    switch (iconName) {
      case 'Wind':
        return {
          icon: Wind,
          iconBg: 'bg-emerald-500/15',
          iconColor: 'text-emerald-500 dark:text-emerald-400',
          activeBorder: 'border-emerald-500/60 ring-2 ring-emerald-500/20',
          activeBg: 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
          badgeBg: 'bg-emerald-500/20',
          badgeText: 'text-emerald-700 dark:text-emerald-300',
        };
      case 'Activity':
        return {
          icon: Activity,
          iconBg: 'bg-amber-500/15',
          iconColor: 'text-amber-500 dark:text-amber-400',
          activeBorder: 'border-amber-500/60 ring-2 ring-amber-500/20',
          activeBg: 'bg-amber-500/10 text-amber-950 dark:text-amber-100',
          badgeBg: 'bg-amber-500/20',
          badgeText: 'text-amber-700 dark:text-amber-300',
        };
      case 'Sparkles':
        return {
          icon: Sparkles,
          iconBg: 'bg-rose-500/15',
          iconColor: 'text-rose-500 dark:text-rose-400',
          activeBorder: 'border-rose-500/60 ring-2 ring-rose-500/20',
          activeBg: 'bg-rose-500/10 text-rose-950 dark:text-rose-100',
          badgeBg: 'bg-rose-500/20',
          badgeText: 'text-rose-700 dark:text-rose-300',
        };
      case 'Zap':
        return {
          icon: Zap,
          iconBg: 'bg-purple-500/15',
          iconColor: 'text-purple-500 dark:text-purple-400',
          activeBorder: 'border-purple-500/60 ring-2 ring-purple-500/20',
          activeBg: 'bg-purple-500/10 text-purple-950 dark:text-purple-100',
          badgeBg: 'bg-purple-500/20',
          badgeText: 'text-purple-700 dark:text-purple-300',
        };
      case 'Heart':
        return {
          icon: Heart,
          iconBg: 'bg-sky-500/15',
          iconColor: 'text-sky-500 dark:text-sky-400',
          activeBorder: 'border-sky-500/60 ring-2 ring-sky-500/20',
          activeBg: 'bg-sky-500/10 text-sky-950 dark:text-sky-100',
          badgeBg: 'bg-sky-500/20',
          badgeText: 'text-sky-700 dark:text-sky-300',
        };
      case 'Brain':
        return {
          icon: Brain,
          iconBg: 'bg-indigo-500/15',
          iconColor: 'text-indigo-500 dark:text-indigo-400',
          activeBorder: 'border-indigo-500/60 ring-2 ring-indigo-500/20',
          activeBg: 'bg-indigo-500/10 text-indigo-950 dark:text-indigo-100',
          badgeBg: 'bg-indigo-500/20',
          badgeText: 'text-indigo-700 dark:text-indigo-300',
        };
      case 'ShieldAlert':
        return {
          icon: ShieldAlert,
          iconBg: 'bg-teal-500/15',
          iconColor: 'text-teal-500 dark:text-teal-400',
          activeBorder: 'border-teal-500/60 ring-2 ring-teal-500/20',
          activeBg: 'bg-teal-500/10 text-teal-950 dark:text-teal-100',
          badgeBg: 'bg-teal-500/20',
          badgeText: 'text-teal-700 dark:text-teal-300',
        };
      case 'Eye':
        return {
          icon: Eye,
          iconBg: 'bg-cyan-500/15',
          iconColor: 'text-cyan-500 dark:text-cyan-400',
          activeBorder: 'border-cyan-500/60 ring-2 ring-cyan-500/20',
          activeBg: 'bg-cyan-500/10 text-cyan-950 dark:text-cyan-100',
          badgeBg: 'bg-cyan-500/20',
          badgeText: 'text-cyan-700 dark:text-cyan-300',
        };
      case 'User':
        return {
          icon: User,
          iconBg: 'bg-pink-500/15',
          iconColor: 'text-pink-500 dark:text-pink-400',
          activeBorder: 'border-pink-500/60 ring-2 ring-pink-500/20',
          activeBg: 'bg-pink-500/10 text-pink-950 dark:text-pink-100',
          badgeBg: 'bg-pink-500/20',
          badgeText: 'text-pink-700 dark:text-pink-300',
        };
      case 'MessageSquareText':
        return {
          icon: MessageSquareText,
          iconBg: 'bg-amber-500/15',
          iconColor: 'text-amber-500 dark:text-amber-400',
          activeBorder: 'border-amber-500/60 ring-2 ring-amber-500/20',
          activeBg: 'bg-amber-500/10 text-amber-950 dark:text-amber-100',
          badgeBg: 'bg-amber-500/20',
          badgeText: 'text-amber-700 dark:text-amber-300',
        };
      case 'Scale':
        return {
          icon: Scale,
          iconBg: 'bg-rose-500/15',
          iconColor: 'text-rose-500 dark:text-rose-400',
          activeBorder: 'border-rose-500/60 ring-2 ring-rose-500/20',
          activeBg: 'bg-rose-500/10 text-rose-950 dark:text-rose-100',
          badgeBg: 'bg-rose-500/20',
          badgeText: 'text-rose-700 dark:text-rose-300',
        };
      default:
        return {
          icon: FolderTree,
          iconBg: 'bg-teal-500/15',
          iconColor: 'text-teal-500 dark:text-teal-400',
          activeBorder: 'border-teal-500/60 ring-2 ring-teal-500/20',
          activeBg: 'bg-teal-500/10 text-teal-950 dark:text-teal-100',
          badgeBg: 'bg-teal-500/20',
          badgeText: 'text-teal-700 dark:text-teal-300',
        };
    }
  };

  // Find active category item
  const selectedCategory =
    selectedCategoryId === 'ALL'
      ? allCategory
      : DISEASE_CATEGORIES.find((c) => c.id === selectedCategoryId) ||
        SPECIAL_TRIAGE_CATEGORIES.find((c) => c.id === selectedCategoryId) ||
        allCategory;

  const selectedStyle = getCategoryStyle((selectedCategory as any).iconName || 'FolderTree');
  const SelectedIcon = selectedStyle.icon;

  // Build full list of selectable categories
  const categories = [allCategory, ...DISEASE_CATEGORIES, ...SPECIAL_TRIAGE_CATEGORIES];

  // Subcategories for current category (if medical)
  const currentSubcategories = getSubcategoriesForCategory(selectedCategoryId);

  return (
    <div className="space-y-3">
      {/* 1. Main Category Stage Selector Card */}
      <StageSelectorCard
        icon={SelectedIcon as LucideIcon}
        title={{ fa: selectedCategory.name.fa, en: selectedCategory.name.en }}
        subtitleEn={selectedCategory.name.en}
        count={categories.length}
        changeLabel={{ fa: 'انتخاب دسته اصلی', en: 'Select Main Category' }}
        isOpen={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
        language={language}
      >
        <div className="space-y-3 animate-fadeIn">
          {/* Section: Medical Disease Categories */}
          <div>
            <div className="text-[11px] font-bold app-muted mb-2 px-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              <span>{isFa ? 'دسته‌بندی بیماری‌های بالینی' : 'Clinical Disease Categories'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {[allCategory, ...DISEASE_CATEGORIES].map((category) => {
                const isSelected = category.id === selectedCategoryId;
                const style = getCategoryStyle((category as any).iconName);
                const Icon = style.icon;
                const categoryCount =
                  category.id === 'ALL'
                    ? (triageOnly ? DISEASES_REGISTRY.filter((d) => hasTriageScenario(d.id)).length : DISEASES_REGISTRY.length)
                    : DISEASES_REGISTRY.filter(
                        (disease) =>
                          disease.categoryId === category.id && (!triageOnly || hasTriageScenario(disease.id))
                      ).length;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      haptic.light();
                      onSelectCategory(category.id);
                      onSelectSubCat('ALL');
                      setIsExpanded(false);
                    }}
                    className={`group text-start p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 select-none relative overflow-hidden ${
                      isSelected
                        ? `${style.activeBorder} ${style.activeBg} font-bold shadow-sm scale-[1.01]`
                        : 'app-border hover:border-slate-400/40 bg-black/5 dark:bg-slate-900/40 hover:bg-black/10 dark:hover:bg-slate-800/60 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          isSelected ? style.iconBg : 'bg-black/5 dark:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? style.iconColor : 'text-slate-400 group-hover:text-slate-200'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold leading-tight truncate ${isSelected ? 'app-text font-black' : 'app-text'}`}>
                          {isFa ? category.name.fa : category.name.en}
                        </p>
                        <p className="text-[10px] app-muted truncate opacity-80 mt-0.5" dir="ltr">
                          {category.name.en}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? `${style.badgeBg} ${style.badgeText}` : 'bg-black/10 dark:bg-slate-800 app-muted'
                        }`}
                      >
                        {categoryCount}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Special Non-Disease Triage Categories (Slang, Legal/Admin) */}
          <div className="pt-2 border-t app-border">
            <div className="text-[11px] font-bold app-muted mb-2 px-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isFa ? 'بخش‌های ویژه تریاژ و ارتباطات (غیربیماری)' : 'Special Triage & Communication Categories'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SPECIAL_TRIAGE_CATEGORIES.map((special) => {
                const isSelected = special.id === selectedCategoryId;
                const style = getCategoryStyle(special.iconName);
                const Icon = style.icon;

                return (
                  <button
                    key={special.id}
                    type="button"
                    onClick={() => {
                      haptic.light();
                      onSelectCategory(special.id);
                      onSelectSubCat('ALL');
                      setIsExpanded(false);
                    }}
                    className={`group text-start p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 select-none relative overflow-hidden ${
                      isSelected
                        ? `${style.activeBorder} ${style.activeBg} font-bold shadow-sm scale-[1.01]`
                        : 'app-border hover:border-amber-400/40 bg-black/5 dark:bg-slate-900/40 hover:bg-black/10 dark:hover:bg-slate-800/60 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          isSelected ? style.iconBg : 'bg-black/5 dark:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? style.iconColor : 'text-slate-400 group-hover:text-slate-200'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold leading-tight truncate ${isSelected ? 'app-text font-black' : 'app-text'}`}>
                          {isFa ? special.name.fa : special.name.en}
                        </p>
                        <p className="text-[10px] app-muted truncate opacity-80 mt-0.5" dir="ltr">
                          {special.name.en}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? `${style.badgeBg} ${style.badgeText}` : 'bg-black/10 dark:bg-slate-800 app-muted'
                        }`}
                      >
                        {special.scenarios.length}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </StageSelectorCard>

      {/* 2. Subcategory Chips Bar (When a clinical category with subcategories is selected) */}
      {currentSubcategories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold app-muted shrink-0 flex items-center gap-1">
            <span>{isFa ? 'زیردسته:' : 'Subcategory:'}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              onSelectSubCat('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition cursor-pointer ${
              selectedSubCatId === 'ALL'
                ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                : 'app-bg app-border app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800/60'
            }`}
          >
            {isFa ? 'همه زیردسته‌ها' : 'All Subcategories'}
          </button>
          {currentSubcategories.map((subcat) => {
            const isSubSelected = selectedSubCatId === subcat.id;
            return (
              <button
                key={subcat.id}
                type="button"
                onClick={() => {
                  haptic.light();
                  onSelectSubCat(subcat.id);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition cursor-pointer ${
                  isSubSelected
                    ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                    : 'app-bg app-border app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800/60'
                }`}
              >
                {isFa ? subcat.name.fa : subcat.name.en}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Triage Filter Checkbox Strip */}
      <div className="flex items-center justify-between gap-2 px-1 pt-0.5 text-xs">
        <label
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition cursor-pointer select-none font-bold text-xs ${
            triageOnly
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20'
              : 'app-bg app-border app-muted hover:app-text hover:border-slate-500/40'
          }`}
        >
          <input
            type="checkbox"
            checked={triageOnly}
            onChange={() => {
              haptic.light();
              onToggleTriageOnly();
            }}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-slate-900 border-slate-700 cursor-pointer"
          />
          <span className="flex items-center gap-1.5">
            <Stethoscope className={`w-3.5 h-3.5 ${triageOnly ? 'text-emerald-400' : 'app-muted'}`} />
            <span>{isFa ? 'فقط بیماری‌ها و موارد دارای تریاژ بالینی' : 'Clinical Triage Cases Only'}</span>
          </span>
        </label>
      </div>
    </div>
  );
};
