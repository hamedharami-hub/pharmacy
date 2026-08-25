'use client';

import React, { useState, useEffect, useRef } from 'react';
import { StudyMode, Language, VisualTheme, LayoutMode, FontSize } from '@/types/pharmacy';
import { User } from '@/lib/firebase';
import { useStudyTracker } from '@/components/study/StudyTrackerContext';
import { haptic } from '@/lib/haptics';
import {
  BookOpen,
  Bookmark,
  Settings,
  Stethoscope,
  Boxes,
  Monitor,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Layers,
  Trophy,
  Award,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  theme: VisualTheme;
  onSetTheme: (theme: VisualTheme) => void;
  fontSize?: FontSize;
  onSetFontSize?: (size: FontSize) => void;
  activeMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
  layoutMode: LayoutMode;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  onOpenSettings: () => void;
  flaggedCount: number;
  user: User | null;
  onOpenAuth: () => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  activeMainModule: 1 | 2 | 3 | 4 | 5 | 6;
  onSelectMainModule: (mod: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onOpenLeitnerBox?: () => void;
  onOpenMindMap?: () => void;
  onOpenAiTutor?: () => void;
  onOpenCommandPalette?: () => void;
  leitnerDueCount?: number;
  leitnerTotalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onOpenSettings,
  user,
  activeMainModule,
  onSelectMainModule,
  onOpenAiTutor,
  onOpenCommandPalette,
  leitnerDueCount = 0,
}) => {
  const isFa = language === 'fa';

  const modulesList = [
    {
      id: 1 as const,
      shortTitle: { fa: '۱. تریاژ OTC', en: '1. OTC Triage' },
      fullTitle: { fa: 'ماژول ۱: تریاژ سرپایی و OTC', en: 'Module 1: OTC Triage' },
      desc: { fa: 'پروتکل‌های WWHAM و Red Flags', en: 'WWHAM & Red Flags' },
      icon: Stethoscope,
      activeColor: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/20',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 2 as const,
      shortTitle: { fa: '۲. قفسه S2/S3', en: '2. S2/S3 Shelf' },
      fullTitle: { fa: 'ماژول ۲: قفسه داروهای S2/S3', en: 'Module 2: Product Shelf' },
      desc: { fa: 'طبقه‌بندی و Project Stop', en: 'S2/S3 & Project Stop' },
      icon: Boxes,
      activeColor: 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-950/20',
      badgeBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    {
      id: 4 as const,
      shortTitle: { fa: '۴. نسخه پیچی', en: '4. Dispensing' },
      fullTitle: { fa: 'ماژول ۴: نسخه پیچی و نرم‌افزار Fred', en: 'Module 4: Prescription Dispensing' },
      desc: { fa: 'نرم‌افزار Fred، قوانین PBS و بررسی نسخه', en: 'Fred Dispense & PBS Rules' },
      icon: Monitor,
      activeColor: 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-950/20',
      badgeBg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    },
    {
      id: 5 as const,
      shortTitle: { fa: '۵. مرور و نقشه ذهنی', en: '5. Leitner & Mind Map' },
      fullTitle: { fa: 'ماژول ۵: جعبه لایتنر، مرور هوشمند و نقشه ذهنی', en: 'Module 5: Leitner Deck & Mind Map' },
      desc: {
        fa: leitnerDueCount > 0 ? `${leitnerDueCount} کارت موعد امروز` : 'مرور FSRS / SM-2 و درخت دانش',
        en: leitnerDueCount > 0 ? `${leitnerDueCount} cards due` : 'FSRS & Concept Graph',
      },
      icon: Layers,
      activeColor: 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/20',
      badgeBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      dueCount: leitnerDueCount,
    },
  ];

  return (
    <header className="sticky top-0 z-40 app-card border-b app-border shadow-sm w-full max-w-full overflow-x-clip backdrop-blur-md bg-slate-900/95">
      <div className="max-w-[1700px] mx-auto px-1.5 sm:px-2.5 md:px-3 lg:px-4 py-2">
        {/* Top Bar: Title & Settings */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {/* App Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black app-text tracking-tight truncate leading-tight">
                {isFa ? 'شبیه‌ساز جامع داروخانه استرالیا' : 'AU Pharmacy Practice Simulator'}
              </h1>
              <p className="text-[10px] app-muted truncate hidden xs:block">
                {isFa ? 'آزمون‌های OPRA & KAPS و استانداردهای TGA/PBS' : 'OPRA & KAPS Exam Knowledge Matrix'}
              </p>
            </div>
          </div>

          {/* Quick AI Assistant, Global Search & Settings Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Command Search (Ctrl+K) */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={() => {
                  haptic.medium();
                  onOpenCommandPalette();
                }}
                className="px-2.5 py-1.5 rounded-xl border app-border app-bg hover:bg-slate-800 app-text transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold shadow-sm group active:scale-95 duration-100"
                title={isFa ? 'جستجوی سریع در کل داروها و سناریوها (Ctrl+K)' : 'Global Quick Search (Ctrl+K)'}
                aria-label={isFa ? 'جستجوی سراسری' : 'Global Search'}
              >
                <Search className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] hidden sm:inline">{isFa ? 'جستجو' : 'Search'}</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* AI Tutor Assistant Button */}
            {onOpenAiTutor && (
              <button
                type="button"
                onClick={() => {
                  haptic.medium();
                  onOpenAiTutor();
                }}
                className="px-2.5 py-1.5 rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-600/25 via-indigo-600/30 to-purple-600/25 hover:from-sky-600/40 hover:via-indigo-600/45 hover:to-purple-600/40 text-sky-200 transition flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-sm group hover:border-sky-400 ring-1 ring-sky-500/20 active:scale-95 duration-100"
                title={isFa ? 'دستیار بالینی و حل سناریوی آزمون هوش مصنوعی' : 'AI Clinical Tutor & OPRA Assistant'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform animate-pulse" />
                <span className="text-[11px] whitespace-nowrap">{isFa ? 'هوش مصنوعی' : 'AI Tutor'}</span>
              </button>
            )}

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => {
                haptic.medium();
                onOpenSettings();
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border app-border app-bg hover:bg-slate-800 app-text transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold shadow-sm active:scale-95 duration-100"
              title={isFa ? 'تنظیمات، تم‌ها، اندازه فونت و پیشرفت' : 'Settings, Themes, Font Size & Progress'}
              aria-label={isFa ? 'تنظیمات' : 'Settings'}
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] hidden xs:inline">{isFa ? 'تنظیمات' : 'Settings'}</span>
              {user && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title={isFa ? 'حساب همگام است' : 'Account synced'} />
              )}
            </button>
          </div>
        </div>

        {/* Main Module Segmented Switcher (Visible on Desktop / Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar border-t app-border pt-1.5 sm:pt-2">
          {modulesList.map((mod) => {
            const ModIcon = mod.icon;
            const isActive = activeMainModule === mod.id;

            return (
              <button
                key={mod.id}
                onClick={() => {
                  haptic.light();
                  onSelectMainModule(mod.id);
                }}
                className={`flex-1 min-w-[128px] sm:min-w-0 py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-xl border text-right transition cursor-pointer flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 sm:shrink active:scale-98 ${
                  isActive
                    ? `${mod.activeColor} ring-1 ring-white/20`
                    : 'app-bg app-border app-text hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : mod.badgeBg
                    }`}
                  >
                    <ModIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-[10.5px] sm:text-xs font-bold block truncate leading-tight">
                        {isFa ? mod.shortTitle.fa : mod.shortTitle.en}
                      </span>
                      {'dueCount' in mod && Number(mod.dueCount) > 0 && (
                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-black rounded-full bg-amber-400 text-slate-950 shrink-0 shadow-sm animate-pulse">
                          {mod.dueCount}
                        </span>
                      )}
                    </div>
                    <span className={`text-[8.5px] sm:text-[9px] block truncate ${isActive ? 'text-white/80' : 'app-muted'}`}>
                      {isFa ? mod.desc.fa : mod.desc.en}
                    </span>
                  </div>
                </div>
                {isActive && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0 hidden sm:block" />}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
