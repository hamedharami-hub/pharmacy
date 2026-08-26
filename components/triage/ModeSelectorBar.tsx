'use client';

import React from 'react';
import { Language } from '@/types/pharmacy';
import { Scenario, ConversationMode } from '@/data/otcScenarios';
import { Layers, Search, Stethoscope } from 'lucide-react';
import { ScenarioListAccordion, cleanLocalizedText } from './ScenarioListAccordion';
import { ScenarioModeSelector } from './ScenarioModeSelector';

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
  isAccordionOpen: boolean;
  setIsAccordionOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  isAccordionOpen,
  setIsAccordionOpen,
  isBrowseOpen,
  setIsBrowseOpen,
  modeACount,
  modeBCount,
  modeCCount,
}) => {
  const isFa = language === 'fa';
  const isSearching = !!scenarioSearchTerm.trim();
  const browseOpen = isBrowseOpen && !isSearching;
  const getCleanTitle = (sc: Scenario) =>
    isFa ? cleanLocalizedText(sc.title.fa || sc.title.en, true) : sc.title.en;
  const getCleanCategory = (sc: Scenario) =>
    isFa ? cleanLocalizedText(sc.category.fa || sc.category.en, true) : sc.category.en;

  return (
    <div className="app-card border app-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* 1. TOP HEADER ROW: Module Brand */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b app-border pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0 border border-sky-400/30">
            <Stethoscope className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black app-text tracking-tight">
                {isFa
                  ? 'ماژول ۱: تریاژ بالینی و سناریوهای مشاوره‌ای OTC'
                  : 'Module 1: Clinical OTC Triage & Consultations'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {selectedConversationMode === 'ALL'
                  ? isFa ? 'همه دسته‌ها' : 'All Modes'
                  : selectedConversationMode === 'MODE_A_ADMIN'
                    ? isFa ? 'روتین و اداری' : 'Admin Mode'
                    : selectedConversationMode === 'MODE_B_SLANG'
                      ? isFa ? 'عامیانه و OTC' : 'OTC Mode'
                      : isFa ? 'تعارض و اخلاق' : 'Conflict Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={scenarioSearchTerm}
          onChange={(e) => setScenarioSearchTerm(e.target.value)}
          placeholder={isFa ? 'جستجوی سناریو، نام بیمار، شرح مراجعه یا دسته‌بندی...' : 'Search scenarios, patient names, presentations or categories...'}
          className="w-full pr-10 pl-4 py-2 rounded-xl border app-border bg-black/30 text-xs app-text focus:outline-none focus:border-teal-500 shadow-inner"
        />
        {scenarioSearchTerm.trim() && (
          <button
            type="button"
            onClick={() => setScenarioSearchTerm('')}
            className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {!browseOpen ? (
        <div className="app-card border border-teal-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg bg-linear-to-b from-teal-950/20 to-transparent animate-fadeIn">
          <div className="flex items-center gap-2.5 border-b app-border pb-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black app-text">
                {isFa ? 'انتخاب دسته و سناریوی مکالمه' : 'Select Conversation Mode & Scenario'}
              </h3>
              <p className="text-[11px] app-muted mt-0.5">
                {isFa ? 'دسته و سناریوی مورد نظر را برای شروع تریاژ انتخاب کنید.' : 'Choose a conversation mode and scenario to begin triage.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ScenarioModeSelector
              selectedMode={selectedConversationMode}
              onSelectMode={onSelectMode}
              language={language}
              modeACount={modeACount}
              modeBCount={modeBCount}
              modeCCount={modeCCount}
            />
            <ScenarioListAccordion
              scenario={scenario}
              filteredScenarios={filteredScenarios}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={onSelectScenario}
              isOpen={isAccordionOpen || isSearching}
              onToggleOpen={() => setIsAccordionOpen((prev) => !prev)}
              language={language}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsBrowseOpen(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-teal-950/50 cursor-pointer transition hover:scale-[1.005] active:scale-99"
          >
            <Layers className="w-5 h-5 text-amber-300" />
            <span>{isFa ? '✨ مشاهده و مطالعه سناریو (View Scenario)' : '✨ View & Study Scenario'}</span>
          </button>
        </div>
      ) : (
        <div className="app-card border border-teal-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm bg-gradient-to-b from-slate-900/90 to-slate-950/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {getCleanCategory(scenario)}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                ID: {scenario.id}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsBrowseOpen(false)}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-teal-400" />
              <span>{isFa ? 'تغییر سناریو و فهرست' : 'Change Scenario'}</span>
            </button>
          </div>

          <div className="w-full space-y-1">
            <h2 className="text-sm sm:text-base font-black text-white leading-relaxed">
              {getCleanTitle(scenario)}
            </h2>
            {isFa && scenario.title.en && (
              <p className="text-xs text-teal-400/90 font-mono leading-relaxed" dir="ltr">
                {scenario.title.en}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
