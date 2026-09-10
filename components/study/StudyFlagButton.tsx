'use client';

import React from 'react';
import { Flag } from 'lucide-react';
import { FlagColor } from '@/types/pharmacy';
import { getFlagDefinitions } from '@/lib/flagDefinitions';
import { useStudyTrackerContext } from './StudyTrackerContext';

interface StudyFlagButtonProps {
  itemId: string;
  language: 'fa' | 'en';
  className?: string;
  stopPropagation?: boolean;
}

const COLORS: Exclude<FlagColor, null>[] = ['red', 'yellow', 'green', 'blue'];

export const StudyFlagButton: React.FC<StudyFlagButtonProps> = ({ itemId, language, className = '', stopPropagation = true }) => {
  const { getItemFlag, setItemFlag } = useStudyTrackerContext();
  const current = getItemFlag(itemId);
  const definitions = getFlagDefinitions();
  const isFa = language === 'fa';
  const next = current ? COLORS[(COLORS.indexOf(current) + 1) % COLORS.length] : COLORS[0];
  const colorClass = current === 'red'
    ? 'text-rose-300 bg-rose-500/15 border-rose-400/40'
    : current === 'yellow'
      ? 'text-amber-300 bg-amber-500/15 border-amber-400/40'
      : current === 'green'
        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40'
        : current === 'blue'
          ? 'text-sky-300 bg-sky-500/15 border-sky-400/40'
          : 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  const label = current ? definitions[current].label : (isFa ? 'بدون فلگ' : 'No flag');

  return (
    <button
      type="button"
      aria-label={`${isFa ? 'فلگ' : 'Flag'} ${itemId}`}
      title={current ? `${label} — ${isFa ? 'کلیک برای تغییر؛ نگه‌داشتن برای حذف' : 'click to cycle; hold to clear'}` : (isFa ? 'افزودن فلگ' : 'Add flag')}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        setItemFlag(itemId, next);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        setItemFlag(itemId, null);
      }}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition hover:scale-105 ${colorClass} ${className}`}
    >
      <Flag className={`h-3.5 w-3.5 ${current ? 'fill-current' : ''}`} />
    </button>
  );
};
