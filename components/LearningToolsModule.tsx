'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Language } from '@/types/pharmacy';
import { LeitnerCard } from '@/types/leitner';
import { LeitnerDeckModule } from '@/components/LeitnerDeckModule';
import { INITIAL_SAMPLE_LEITNER_CARDS } from '@/lib/sample-leitner-cards';
import { Layers, Network, Sparkles } from 'lucide-react';
import { ModuleHeaderBar } from '@/components/ui';

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
    <div className="space-y-2.5 min-w-0" dir={isFa ? 'rtl' : 'ltr'}>
      <ModuleHeaderBar
        icon={Sparkles}
        accent="purple"
        title={{ fa: 'ماژول ۵: ابزارهای یادگیری', en: 'Module 5: Learning Tools' }}
        subtitle={{ fa: 'مرور فلش‌کارت‌ها و نقشه ذهنی', en: 'Flashcard review and mind map' }}
        language={language}
        actions={
          <div className="app-card app-border rounded-full border p-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('leitner')}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
              activeTab === 'leitner'
                ? 'bg-purple-600 text-white'
                : 'app-muted hover:opacity-80'
            }`}
            title={isFa ? 'مرور فلش‌کارت‌ها (Review)' : 'Flashcard Review'}
          >
            <Layers className="w-4 h-4" />
            <span>{isFa ? 'مرور' : 'Review'}</span>
            {dueCount > 0 && (
              <span className="absolute -top-1 -end-1 px-1 min-w-3.5 h-3.5 text-[8.5px] font-mono font-black rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                {dueCount > 99 ? '99+' : dueCount}
              </span>
            )}
          </button>

          {/* Shape 2: Mind Map Network Icon */}
          <button
            type="button"
            onClick={() => setActiveTab('mindmap')}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mindmap'
                ? 'bg-purple-600 text-white'
                : 'app-muted hover:opacity-80'
            }`}
            title={isFa ? 'نقشه ذهنی (Mind Map)' : 'Mind Map'}
          >
            <Network className="w-4 h-4" />
            <span>{isFa ? 'نقشه ذهنی' : 'Mind Map'}</span>
          </button>
        </div>
        }
      />

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
