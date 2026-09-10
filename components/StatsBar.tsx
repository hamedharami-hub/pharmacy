'use client';

import React from 'react';
import { Language } from '@/types/pharmacy';
import { CheckCircle2, BookOpen, Flag, Award, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useStudyTrackerContext } from './study/StudyTrackerContext';

interface StatsBarProps {
  language: Language;
  totalCards: number;
  reviewedCount: number;
  flaggedCount: number;
  quizScorePct: number;
  onOpenAnalytics?: () => void;
}

type StatTone = 'emerald' | 'sky' | 'rose' | 'violet';

const toneStyles: Record<StatTone, { surface: string; icon: string; value: string; ring: string }> = {
  emerald: { surface: 'bg-emerald-500/[0.08] border-emerald-400/25', icon: 'bg-emerald-500/15 text-emerald-300', value: 'text-emerald-300', ring: 'from-emerald-400 to-teal-400' },
  sky: { surface: 'bg-sky-500/[0.08] border-sky-400/25', icon: 'bg-sky-500/15 text-sky-300', value: 'text-sky-300', ring: 'from-sky-400 to-cyan-400' },
  rose: { surface: 'bg-rose-500/[0.08] border-rose-400/25', icon: 'bg-rose-500/15 text-rose-300', value: 'text-rose-300', ring: 'from-rose-400 to-pink-400' },
  violet: { surface: 'bg-violet-500/[0.08] border-violet-400/25', icon: 'bg-violet-500/15 text-violet-300', value: 'text-violet-300', ring: 'from-violet-400 to-fuchsia-400' },
};

export const StatsBar: React.FC<StatsBarProps> = ({
  language,
  totalCards,
  reviewedCount,
  flaggedCount,
  quizScorePct,
  onOpenAnalytics,
}) => {
  const isFa = language === 'fa';
  const { getOverallStats, isLoaded } = useStudyTrackerContext();
  const centralStats = getOverallStats();
  const effectiveReviewedCount = isLoaded ? centralStats.completedCount : reviewedCount;
  const effectiveFlaggedCount = isLoaded ? centralStats.flaggedCount : flaggedCount;
  const progressPct = totalCards > 0 ? Math.min(100, Math.round((effectiveReviewedCount / totalCards) * 100)) : 0;
  const cardBase = 'relative overflow-hidden rounded-2xl border p-3 sm:p-3.5 min-w-[148px] sm:min-w-0 snap-start shadow-sm transition duration-200';

  const stats: Array<{ label: string; value: string | number; hint: string; tone: StatTone; icon: React.ElementType; clickable?: boolean }> = [
    { label: isFa ? 'پیشرفت مطالعه' : 'Study Progress', value: `${progressPct}%`, hint: isFa ? `${effectiveReviewedCount} تکمیل‌شده` : `${effectiveReviewedCount} completed`, tone: 'emerald', icon: CheckCircle2, clickable: true },
    { label: isFa ? 'کل مباحث' : 'Total Topics', value: totalCards, hint: isFa ? 'در رجیستری مطالعه' : 'In study registry', tone: 'sky', icon: BookOpen },
    { label: isFa ? 'فلگ‌ها' : 'Flagged Notes', value: effectiveFlaggedCount, hint: isFa ? 'برای مرور بعدی' : 'For later review', tone: 'rose', icon: Flag },
    { label: isFa ? 'نمره آزمون' : 'Quiz Score', value: `${quizScorePct}%`, hint: isFa ? 'میانگین عملکرد' : 'Average performance', tone: 'violet', icon: Award, clickable: true },
  ];

  return (
    <div className="rounded-3xl border app-border bg-black/[0.03] dark:bg-white/[0.03] p-2 sm:p-2.5">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] app-muted">{isFa ? 'نمای کلی' : 'Overview'}</p>
          <p className="text-xs font-bold app-text">{isFa ? 'وضعیت فعلی یادگیری شما' : 'Your current learning snapshot'}</p>
        </div>
        {onOpenAnalytics && <span className="rounded-full border app-border px-2 py-1 text-[9px] font-bold app-muted">{isFa ? 'برای جزئیات کلیک کنید' : 'Tap for details'}</span>}
      </div>
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-4">
        {stats.map(({ label, value, hint, tone, icon: Icon, clickable }) => {
          const styles = toneStyles[tone];
          return (
            <button
              key={label}
              type="button"
              onClick={clickable ? onOpenAnalytics : undefined}
              disabled={!clickable || !onOpenAnalytics}
              className={`${cardBase} ${styles.surface} text-start ${clickable && onOpenAnalytics ? 'group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'cursor-default'}`}
              title={clickable && onOpenAnalytics ? (isFa ? 'بازکردن داشبورد تحلیلی' : 'Open analytics dashboard') : undefined}
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${styles.ring} opacity-80`} />
              <div className="flex items-start justify-between gap-2">
                <div className={`rounded-xl p-2 ${styles.icon}`}><Icon className="h-4 w-4" /></div>
                {clickable && onOpenAnalytics && <ArrowUpRight className="h-3.5 w-3.5 app-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
              </div>
              <p className="mt-3 truncate text-[10px] font-bold app-muted">{label}</p>
              <p className={`mt-0.5 text-xl font-black tracking-tight ${styles.value}`}>{value}</p>
              <p className="mt-1 truncate text-[9px] app-muted">{hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
