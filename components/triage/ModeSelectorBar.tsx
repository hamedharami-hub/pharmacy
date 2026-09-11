'use client';

import React from 'react';
import { Language } from '@/types/pharmacy';
import { Scenario, ConversationMode } from '@/data/otcScenarios';
import { Layers, Search, Stethoscope } from 'lucide-react';
import { ScenarioListAccordion, cleanLocalizedText } from './ScenarioListAccordion';
import { ModuleSearchField } from '@/components/ui';

interface ModeSelectorBarProps {
  language: Language;
  selectedConversationMode: ConversationMode | 'ALL';
  onSelectMode: (mode: ConversationMode | 'ALL') => void;
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  scenario: Scenario;
  filteredScenarios: Scenario[];
  scenarioSearchTerm: string;
  setScenarioSearchTerm: (term: string) => void;
  isBrowseOpen: boolean;
  setIsBrowseOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modeACount: number;
  modeBCount: number;
  modeCCount: number;
}

export const ModeSelectorBar: React.FC<ModeSelectorBarProps> = ({
  language,
  selectedConversationMode,
  onSelectMode,
  selectedScenarioId,
  onSelectScenario,
  scenario,
  filteredScenarios,
  scenarioSearchTerm,
  setScenarioSearchTerm,
  isBrowseOpen,
  setIsBrowseOpen,
  modeACount,
  modeBCount,
  modeCCount,
}) => {
  const isFa = language === 'fa';
  const getCleanTitle = (sc: Scenario) =>
    isFa ? cleanLocalizedText(sc.title.fa || sc.title.en, true) : sc.title.en;
  const getCleanCategory = (sc: Scenario) =>
    isFa ? cleanLocalizedText(sc.category.fa || sc.category.en, true) : sc.category.en;

  const modes: Array<{ id: ConversationMode | 'ALL'; fa: string; en: string; count: number }> = [
    { id: 'ALL', fa: 'همه', en: 'All', count: modeACount + modeBCount + modeCCount },
    { id: 'MODE_B_SLANG', fa: 'OTC', en: 'OTC', count: modeBCount },
    { id: 'MODE_A_ADMIN', fa: 'اداری', en: 'Admin', count: modeACount },
    { id: 'MODE_C_CONFLICT', fa: 'اخلاق', en: 'Ethics', count: modeCCount },
  ];

  return (
    <section
      className="app-card border app-border rounded-2xl p-3 sm:p-4 shadow-sm space-y-3"
      aria-label={isFa ? 'انتخاب سناریوی تریاژ' : 'Triage scenario selection'}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                {getCleanCategory(scenario)}
              </span>
              <span className="text-[10px] app-muted">
                {isFa ? `${modeACount + modeBCount + modeCCount} سناریو` : `${modeACount + modeBCount + modeCCount} scenarios`}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-black app-text truncate mt-1">{getCleanTitle(scenario)}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsBrowseOpen((open) => !open)}
          aria-expanded={isBrowseOpen}
          className="shrink-0 px-2.5 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          {isBrowseOpen ? <Layers className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
          <span>{isBrowseOpen ? (isFa ? 'بستن فهرست' : 'Close list') : (isFa ? 'تغییر سناریو' : 'Change scenario')}</span>
        </button>
      </div>

      {isBrowseOpen && (
        <div className="space-y-3 pt-3 border-t app-border animate-fadeIn">
          <ModuleSearchField
            value={scenarioSearchTerm}
            onChange={setScenarioSearchTerm}
            language={language}
            placeholder={{
              fa: 'جستجوی سناریو، بیمار یا شرح مراجعه…',
              en: 'Search scenarios, patients or presentations…',
            }}
          />

          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={isFa ? 'دستهٔ سناریو' : 'Scenario mode'}>
            {modes.map((mode) => {
              const selected = selectedConversationMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onSelectMode(mode.id)}
                  aria-pressed={selected}
                  className={`min-w-0 rounded-xl border px-2 py-2 text-[10px] sm:text-[11px] font-bold transition cursor-pointer ${
                    selected
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'app-bg app-muted app-border hover:app-text hover:border-sky-500/40'
                  }`}
                >
                  <span className="block truncate">{isFa ? mode.fa : mode.en}</span>
                  <span className="block mt-0.5 text-[9px] font-mono opacity-80">{mode.count}</span>
                </button>
              );
            })}
          </div>

          <ScenarioListAccordion
            scenario={scenario}
            filteredScenarios={filteredScenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={onSelectScenario}
            isOpen
            onToggleOpen={() => setIsBrowseOpen(false)}
            showTrigger={false}
            language={language}
          />
        </div>
      )}
    </section>
  );
};
