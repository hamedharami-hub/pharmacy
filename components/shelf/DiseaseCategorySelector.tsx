'use client';

import React, { useState } from 'react';
import { DISEASE_CATEGORIES, DISEASES_REGISTRY } from '@/data/diseasesRegistry';
import { Language } from '@/types/pharmacy';
import {
  Activity,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  FolderTree,
  Heart,
  ShieldAlert,
  Sparkles,
  User,
  Wind,
  Zap,
} from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface DiseaseCategorySelectorProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
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

export const DiseaseCategorySelector: React.FC<DiseaseCategorySelectorProps> = ({
  selectedCategoryId,
  onSelectCategory,
  language,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFa = language === 'fa';
  const allCategory = {
    id: 'ALL',
    name: { fa: 'همه دسته‌بندی‌ها', en: 'All Categories' },
    iconName: 'FolderTree',
  };

  const selectedCategory =
    selectedCategoryId === 'ALL'
      ? allCategory
      : DISEASE_CATEGORIES.find((category) => category.id === selectedCategoryId) || allCategory;

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

  const selectedStyle = getCategoryStyle(selectedCategory.iconName);
  const SelectedIcon = selectedStyle.icon;
  const categories = [allCategory, ...DISEASE_CATEGORIES];

  return (
    <div className="space-y-2">
      {!isExpanded && (
        <div className="app-card border app-border rounded-2xl overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              setIsExpanded(true);
            }}
            className="w-full text-start p-3 sm:p-3.5 app-bg hover:bg-black/5 dark:hover:bg-slate-900 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 select-none"
            title={isFa ? 'کلیک کنید تا تمام دسته‌بندی‌ها نمایش داده شوند' : 'Click to show all disease categories'}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${selectedStyle.iconBg}`}>
                <SelectedIcon className={`w-4 h-4 ${selectedStyle.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-black leading-tight app-text truncate">
                  {isFa ? selectedCategory.name.fa : selectedCategory.name.en}
                </h4>
                <p className="text-[10px] app-muted truncate opacity-80 mt-0.5" dir="ltr">
                  {selectedCategory.name.en}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-2 py-1 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center gap-1 transition">
                <span>{isFa ? 'تغییر دامنه' : 'Change Domain'}</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </div>
            </div>
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b app-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-500">
                <FolderTree className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs sm:text-sm font-black app-text">
                {isFa ? 'انتخاب دسته‌بندی بیماری (برای اعمال کلیک کنید):' : 'Select Disease Category:'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                haptic.light();
                setIsExpanded(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>{isFa ? 'بستن منو' : 'Collapse'}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {categories.map((category) => {
              const isSelected = category.id === selectedCategoryId;
              const style = getCategoryStyle(category.iconName);
              const Icon = style.icon;
              const categoryCount =
                category.id === 'ALL'
                  ? DISEASES_REGISTRY.length
                  : DISEASES_REGISTRY.filter((disease) => disease.categoryId === category.id).length;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    haptic.light();
                    onSelectCategory(category.id);
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
      )}
    </div>
  );
};
