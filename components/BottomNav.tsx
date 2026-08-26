'use client';

import React from 'react';
import {
  Stethoscope,
  Boxes,
  Monitor,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Language } from '@/types/pharmacy';
import { haptic } from '@/lib/haptics';

interface BottomNavProps {
  language: Language;
  activeModule: 1 | 2 | 3 | 4 | 5 | 6;
  onSelectModule: (mod: 1 | 2 | 3 | 4 | 5 | 6) => void;
  leitnerDueCount?: number;
  onOpenAiTutor?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  language,
  activeModule,
  onSelectModule,
  leitnerDueCount = 0,
  onOpenAiTutor,
}) => {
  const isFa = language === 'fa';

  const navItems = [
    {
      id: 1 as const,
      label: { fa: 'تریاژ', en: 'Triage' },
      icon: Stethoscope,
      accent: 'text-emerald-600 dark:text-emerald-400',
      activeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/20',
    },
    {
      id: 2 as const,
      label: { fa: 'قفسه', en: 'Shelf' },
      icon: Boxes,
      accent: 'text-sky-600 dark:text-sky-400',
      activeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40 shadow-sm shadow-sky-950/20',
    },
    {
      id: 4 as const,
      label: { fa: 'نسخه پیچی', en: 'Dispensing' },
      icon: Monitor,
      accent: 'text-teal-600 dark:text-teal-400',
      activeBg: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40 shadow-sm shadow-teal-950/20',
    },
    {
      id: 5 as const,
      label: { fa: 'لایتنر', en: 'Leitner' },
      icon: Brain,
      accent: 'text-purple-600 dark:text-purple-400',
      activeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40 shadow-sm shadow-purple-950/20',
      badge: leitnerDueCount,
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar with Theme Glassmorphism */}
      <nav
        aria-label={isFa ? 'ناوبری موبایل' : 'Mobile navigation'}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 app-glass-header border-t app-border px-2 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-around gap-1.5 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptic.light();
                  onSelectModule(item.id);
                }}
                aria-label={isFa ? item.label.fa : item.label.en}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 py-1.5 px-1 min-h-[48px] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer relative active:scale-95 ${
                  isActive
                    ? `${item.activeBg} font-black border ring-1 ring-black/5 dark:ring-white/10`
                    : 'app-muted hover:app-text border border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform duration-150`} />
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="absolute -top-1.5 -end-2.5 px-1.5 min-w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9.5px] font-black flex items-center justify-center shadow-md animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] truncate leading-tight font-bold">
                  {isFa ? item.label.fa : item.label.en}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
