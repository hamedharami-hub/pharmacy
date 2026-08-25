'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Language } from '@/types/pharmacy';
import { LeitnerCard } from '@/types/leitner';
import { LeitnerDeckModule } from '@/components/LeitnerDeckModule';
import { INITIAL_SAMPLE_LEITNER_CARDS } from '@/lib/sample-leitner-cards';
import { Layers, Network, Sparkles } from 'lucide-react';

const LeitnerMindMapPanel = dynamic(
  () => import('@/components/LeitnerMindMapPanel').then((mod) => mod.LeitnerMindMapPanel),
  { ssr: false }
);

interface LearningToolsModuleProps {
  language: Language;
  cards: LeitnerCard[];
  onUpdateCards: (updatedCards: LeitnerCard[]) => void;
  onOpenAiLeitner?: (snippetText: string, moduleNum?: 1 | 2 | 3 | 4, category?: string, topic?: string) => void;
  initialTab?: 'leitner' | 'mindmap';
}

export const LearningToolsModule: React.FC<LearningToolsModuleProps> = ({
  language,
  cards,
  onUpdateCards,
  onOpenAiLeitner,
  initialTab = 'leitner',
}) => {
  const [activeTab, setActiveTab] = useState<'leitner' | 'mindmap'>(initialTab);
  const isFa = language === 'fa';

  const dueCount = cards.filter((c) => {
    if (!c.nextReviewDate) return true;
    return new Date(c.nextReviewDate) <= new Date();
  }).length;

  const handleDeleteLeitnerCard = (cardId: string) => {
    onUpdateCards(cards.filter((c) => c.id !== cardId));
  };

  return (
    <div className="space-y-3 min-w-0" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Unified Tab Switcher Header */}
      <div className="app-card border border-purple-500/30 rounded-2xl p-3 sm:p-4 bg-slate-900/90 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-sm shrink-0">
            {activeTab === 'leitner' ? (
              <Layers className="w-4 h-4 text-purple-200" />
            ) : (
              <Network className="w-4 h-4 text-cyan-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                {isFa
                  ? 'ماژول ۵: ابزارهای یادگیری، مرور فاصله‌دار و نقشه ذهنی'
                  : 'Module 5: Learning Tools, Leitner Spaced Review & Mind Map'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] sm:text-[11px] font-mono font-bold">
                {activeTab === 'leitner'
                  ? isFa
                    ? 'جعبه لایتنر SM-2'
                    : 'Leitner SM-2'
                  : isFa
                  ? 'درخت دانش و ارتباط مفاهیم'
                  : 'Knowledge Graph'}
              </span>
            </div>
          </div>
        </div>

        {/* Dual Mode Switcher Button */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border app-border text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('leitner')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'leitner'
                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isFa ? 'مرور فاصله‌دار لایتنر (Anki)' : 'Leitner Review (Anki)'}</span>
            {dueCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-black rounded-full bg-amber-400 text-slate-950">
                {dueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mindmap')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mindmap'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isFa ? '🗺️ نقشه ذهنی و درخت دانش' : '🗺️ Mind Map & Tree'}</span>
          </button>
        </div>
      </div>

      {/* Active Tab View */}
      {activeTab === 'leitner' && (
        <LeitnerDeckModule
          language={language}
          cards={cards}
          initialView="anki_study"
          onUpdateCards={onUpdateCards}
          onOpenAiLeitner={() => onOpenAiLeitner?.('', 4)}
        />
      )}

      {activeTab === 'mindmap' && (
        <LeitnerMindMapPanel
          language={language}
          cards={cards}
          showLeitnerGrading={false}
          onStartStudyBranch={({ title, cardIds }) => {
            setActiveTab('leitner');
          }}
          onOpenAiGenerator={() => onOpenAiLeitner?.('', 4)}
          onAddSampleCards={() => {
            const existingIds = new Set(cards.map((c) => c.id));
            const newOnes = INITIAL_SAMPLE_LEITNER_CARDS.filter((c) => !existingIds.has(c.id));
            if (newOnes.length > 0) {
              onUpdateCards([...cards, ...newOnes]);
            }
          }}
          onDeleteCard={handleDeleteLeitnerCard}
        />
      )}
    </div>
  );
};
