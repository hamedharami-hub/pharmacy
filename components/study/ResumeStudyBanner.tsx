'use client';

import React, { useState } from 'react';
import { LastStudiedItem, MainStudyModuleId } from '@/types/studyTrack';
import { Language } from '@/types/pharmacy';
import { Compass, ArrowRight, ArrowLeft, Clock, X, Sparkles, BookOpen } from 'lucide-react';
import { useStudyTrackerContext } from './StudyTrackerContext';

interface ResumeStudyBannerProps {
  language: Language;
  lastStudied?: LastStudiedItem | null;
  currentModuleId?: MainStudyModuleId;
  onResume: (item: LastStudiedItem) => void;
  className?: string;
}

export const ResumeStudyBanner: React.FC<ResumeStudyBannerProps> = ({
  language,
  lastStudied: propLastStudied,
  currentModuleId,
  onResume,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const isFa = language === 'fa';
  const tracker = useStudyTrackerContext();

  const activeLastStudied = propLastStudied !== undefined ? propLastStudied : tracker?.studyState?.lastStudiedGlobal;

  // Do not show resume banner on module 5 (Learning Tools & Mind Map)
  if (currentModuleId === 5 || currentModuleId === (6 as any)) return null;

  if (!activeLastStudied || isDismissed) return null;

  const lastStudied = activeLastStudied;

  // Module Names dictionary
  const moduleNames: Record<number, { fa: string; en: string }> = {
    1: { fa: 'ماژول ۱: تریاژ OTC', en: 'Mod 1: OTC Triage' },
    2: { fa: 'ماژول ۲: قفسه داروها', en: 'Mod 2: Product Shelf' },
    3: { fa: 'ماژول ۳: نسخه پیچی Fred', en: 'Mod 3: Fred Dispense' },
    4: { fa: 'ماژول ۴: فارماکولوژی بالینی', en: 'Mod 4: Clinical Knowledge' },
    5: { fa: 'ماژول ۵: جعبه لایتنر', en: 'Mod 5: Leitner Box' },
  };

  const modBadge = moduleNames[lastStudied.moduleId] || {
    fa: `ماژول ${lastStudied.moduleId}`,
    en: `Module ${lastStudied.moduleId}`,
  };

  // Format relative time or simple string
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(isFa ? 'fa-IR' : 'en-AU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      dir={isFa ? 'rtl' : 'ltr'}
      className={`relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/70 via-slate-900/90 to-indigo-950/70 backdrop-blur-md p-3 sm:p-3.5 shadow-md shadow-sky-950/40 transition-all animate-fadeIn ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Context & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-sky-800">
            <Compass className="w-5 h-5 text-cyan-200 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isFa ? 'ادامه مطالعه از آخرین مبحث:' : 'Resume from where you left off:'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                {isFa ? modBadge.fa : modBadge.en}
              </span>
              {lastStudied.category && (
                <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                  ({isFa ? lastStudied.category.fa : lastStudied.category.en})
                </span>
              )}
            </div>

            <h4 className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
              {isFa ? lastStudied.title.fa : lastStudied.title.en}
            </h4>
          </div>
        </div>

        {/* Right Side: Action Button & Close */}
        <div className="flex items-center gap-2 shrink-0 ms-auto">
          <button
            type="button"
            onClick={() => onResume(lastStudied)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-sky-900/40 transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>{isFa ? 'ادامه مطالعه' : 'Continue Study'}</span>
            {isFa ? (
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-200" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-cyan-200" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isFa ? 'بستن پیام' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
