'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, Play, Stethoscope } from 'lucide-react';
import { getScenariosForDisease } from '@/lib/diseaseTriageBridge';
import { Language } from '@/types/pharmacy';

interface DiseaseTriagePanelProps {
  diseaseId: string;
  language: Language;
  onStartTriage?: (triageContext: string) => void;
}

const labels = {
  fa: {
    title: 'تمرین تریاژ برای این بیماری',
    subtitle: 'سناریو را انتخاب کنید تا مستقیم وارد شبیه‌ساز شوید.',
    start: 'شروع تریاژ',
  },
  en: {
    title: 'Triage practice for this condition',
    subtitle: 'Choose a scenario to enter the simulator directly.',
    start: 'Start triage',
  },
} as const;

export function DiseaseTriagePanel({ diseaseId, language, onStartTriage }: DiseaseTriagePanelProps) {
  const scenarios = useMemo(() => getScenariosForDisease(diseaseId), [diseaseId]);
  const isFa = language === 'fa';
  const text = isFa ? labels.fa : labels.en;

  if (scenarios.length === 0) return null;

  return (
    <section className="rounded-2xl border border-teal-500/25 bg-teal-500/[0.06] p-3.5 sm:p-4 shadow-sm" aria-label={text.title}>
      <div className="flex items-start gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/25 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0">
          <Stethoscope className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-xs sm:text-sm font-black app-text">{text.title}</h2>
          <p className="text-[10px] sm:text-xs app-muted mt-0.5">{text.subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {scenarios.slice(0, 4).map((scenario) => {
          const title = isFa ? scenario.title.fa : scenario.title.en;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => onStartTriage?.(`triage:${scenario.id}`)}
              className="group flex items-center justify-between gap-3 rounded-xl app-bg border app-border px-3 py-2.5 text-start hover:border-teal-400/60 hover:bg-teal-500/[0.08] transition"
              aria-label={`${text.start}: ${title}`}
            >
              <span className="min-w-0">
                <span className="block text-[11px] sm:text-xs font-black app-text truncate" dir="auto">{title}</span>
                <span className="block text-[10px] app-muted mt-0.5 truncate" dir="auto">{isFa ? scenario.patientProfile.presentation.fa : scenario.patientProfile.presentation.en}</span>
              </span>
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-teal-700 dark:text-teal-300">
                <Play className="w-3 h-3 fill-current" /> {text.start}<ArrowUpRight className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
