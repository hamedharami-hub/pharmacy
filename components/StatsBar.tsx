'use client';

import React from 'react';
import { Language } from '@/types/pharmacy';
import { CheckCircle2, BookOpen, Flag, Award } from 'lucide-react';

interface StatsBarProps {
  language: Language;
  totalCards: number;
  reviewedCount: number;
  flaggedCount: number;
  quizScorePct: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  language,
  totalCards,
  reviewedCount,
  flaggedCount,
  quizScorePct,
}) => {
  const isFa = language === 'fa';
  const progressPct = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="app-card border app-border rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold app-muted block">
            {isFa ? 'پیشرفت مطالعه' : 'Study Progress'}
          </span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">
            {progressPct}%
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      <div className="app-card border app-border rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold app-muted block">
            {isFa ? 'کل مباحث' : 'Total Topics'}
          </span>
          <span className="text-lg font-extrabold app-text font-mono">
            {totalCards}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
      </div>

      <div className="app-card border app-border rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold app-muted block">
            {isFa ? 'نکات پرچمدار' : 'Flagged Notes'}
          </span>
          <span className="text-lg font-extrabold text-rose-400 font-mono">
            {flaggedCount}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
          <Flag className="w-5 h-5" />
        </div>
      </div>

      <div className="app-card border app-border rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold app-muted block">
            {isFa ? 'نمره آزمون' : 'Quiz Score'}
          </span>
          <span className="text-lg font-extrabold text-purple-400 font-mono">
            {quizScorePct}%
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
