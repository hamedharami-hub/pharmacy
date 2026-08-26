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
      {/* Ultra-Compact Header & Dual-Shape View Switcher */}
      <div className="app-card border app-border rounded-2xl p-2.5 sm:p-3 bg-slate-900/80 backdrop-blur-md shadow-md flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-linear-to-tr from-purple-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-xs shrink-0">
            {activeTab === 'leitner' ? (
              <Layers className="w-3.5 h-3.5 text-purple-200" />
            ) : (
              <Network className="w-3.5 h-3.5 text-cyan-200" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-white truncate leading-tight">
              {isFa
                ? activeTab === 'leitner'
                  ? 'مرور هوشمند و فلش‌کارت‌ها (Review)'
                  : 'نقشه ذهنی و درخت دانش (Mind Map)'
                : activeTab === 'leitner'
                ? 'Smart Flashcard Review'
                : 'Knowledge Tree & Mind Map'}
            </h2>
          </div>
        </div>

        {/* Dual Shape Icon Switcher (Compact & Modern) */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border app-border">
          {/* Shape 1: Flashcard / Review Icon */}
          <button
            type="button"
            onClick={() => setActiveTab('leitner')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'leitner'
                ? 'bg-purple-600 text-white shadow-xs ring-1 ring-purple-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title={isFa ? 'مرور فلش‌کارت‌ها (Review)' : 'Flashcard Review'}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[11px] hidden sm:inline">{isFa ? 'مرور' : 'Review'}</span>
            {dueCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-black rounded-full bg-amber-400 text-slate-950">
                {dueCount}
              </span>
            )}
          </button>

          {/* Shape 2: Mind Map Network Icon */}
          <button
            type="button"
            onClick={() => setActiveTab('mindmap')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mindmap'
                ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-xs ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title={isFa ? 'نقشه ذهنی (Mind Map)' : 'Mind Map'}
          >
            <Network className="w-4 h-4 text-cyan-300" />
            <span className="text-[11px] hidden sm:inline">{isFa ? 'نقشه ذهنی' : 'Mind Map'}</span>
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
