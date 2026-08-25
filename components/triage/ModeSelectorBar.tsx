'use client';

import React from 'react';
import { Language } from '@/types/pharmacy';
import { Scenario, ConversationMode } from '@/data/otcScenarios';
import { CONVERSATION_MODES, getScenarioMode } from './types';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Folder,
  Search,
  MessageSquare,
  Check,
} from 'lucide-react';

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
  modeACount: number;
  modeBCount: number;
  modeCCount: number;
}

// Helper to remove mixed-language bracket clutter when displaying in Persian
const cleanLocalizedText = (text: string, isFa: boolean): string => {
  if (!text) return '';
  if (!isFa) return text;
  // Remove parenthesized Latin text/translations e.g. (G'day mate), (Brand vs Generic Debate), (Male)
  return text.replace(/\s*\([a-zA-Z0-9\s/&,.:'?!-]+\)/g, '').trim();
};

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
  modeACount,
  modeBCount,
  modeCCount,
}) => {
  const isFa = language === 'fa';

  const getCleanTitle = (sc: Scenario) => {
    if (!isFa) return sc.title.en;
    return cleanLocalizedText(sc.title.fa || sc.title.en, true);
  };

  const getCleanPresentation = (sc: Scenario) => {
    if (!isFa) return sc.patientProfile.presentation.en;
    return cleanLocalizedText(sc.patientProfile.presentation.fa || sc.patientProfile.presentation.en, true);
  };

  const getCleanCategory = (sc: Scenario) => {
    if (!isFa) return sc.category.en;
    return cleanLocalizedText(sc.category.fa || sc.category.en, true);
  };

  const modeTabs = [
    {
      id: 'ALL' as const,
      labelFa: 'همه سناریوها',
      labelEn: 'All Scenarios',
      count: modeACount + modeBCount + modeCCount,
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'MODE_B_SLANG' as const,
      labelFa: 'عامیانه و OTC (B)',
      labelEn: 'OTC & Slang (B)',
      count: modeBCount,
      icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'MODE_A_ADMIN' as const,
      labelFa: 'روتین و اداری (A)',
      labelEn: 'Admin & Routine (A)',
      count: modeACount,
      icon: <Folder className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'MODE_C_CONFLICT' as const,
      labelFa: 'تعارض و اخلاق (C)',
      labelEn: 'Conflict & Ethics (C)',
      count: modeCCount,
      icon: <Stethoscope className="w-3.5 h-3.5 text-purple-400" />,
    },
  ];

  return (
    <div className="app-card border app-border rounded-2xl p-4 sm:p-5 shadow-md bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950/95 backdrop-blur-md space-y-4">
      {/* 1. TOP HEADER ROW: Module Brand */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b app-border pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0 border border-sky-400/30">
            <Stethoscope className="w-4 h-4 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
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

      {/* 2. SUB-NAVIGATION MODE TABS */}
      <div className="flex items-center gap-1.5 bg-black/30 p-1.5 rounded-xl border app-border text-xs overflow-x-auto no-scrollbar max-w-full">
        {modeTabs.map((tab) => {
          const isSelected = selectedConversationMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectMode(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/40'
                  : 'app-muted hover:app-text hover:bg-slate-800/60'
              }`}
            >
              {tab.icon}
              <span>{isFa ? tab.labelFa : tab.labelEn}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/30 text-sky-200' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE SCENARIO SELECTOR BAR */}
      <div className="pt-2 border-t app-border">
        <button
          type="button"
          onClick={() => setIsAccordionOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-black/40 hover:bg-black/60 border app-border text-xs font-bold transition group cursor-pointer shadow-inner"
        >
          <div className="flex items-center gap-2.5 overflow-hidden text-right">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <Folder className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="app-muted text-[11px]">{isFa ? 'سناریوی انتخابی:' : 'Active Scenario:'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold border border-sky-500/30">
                  {getCleanCategory(scenario)}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-bold app-text truncate block mt-0.5">
                {getCleanTitle(scenario)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-[11px] px-2.5 py-1 rounded-lg bg-sky-600/30 text-sky-300 border border-sky-500/40">
              {isFa ? `انتخاب از ${filteredScenarios.length} سناریو` : `Choose from ${filteredScenarios.length} Scenarios`}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-600/20 group-hover:bg-sky-600/40 text-sky-400 flex items-center justify-center transition border border-sky-500/30">
              {isAccordionOpen ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
            </div>
          </div>
        </button>

        {/* Collapsible Scenario Switcher Dropdown Grid */}
        {isAccordionOpen && (
          <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-black/75 border border-sky-500/40 space-y-3 shadow-2xl animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-3 border-b app-border">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Stethoscope className="w-4 h-4 shrink-0" />
                <span>{isFa ? 'فهرست سناریوها' : 'Scenario List'}</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono border border-sky-500/30">
                  {filteredScenarios.length} {isFa ? 'مورد' : 'items'}
                </span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={scenarioSearchTerm}
                  onChange={(e) => setScenarioSearchTerm(e.target.value)}
                  placeholder={isFa ? 'جستجو در سناریوها...' : 'Search scenarios...'}
                  className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-black/60 border app-border text-xs app-text placeholder:app-muted focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredScenarios.length > 0 ? (
                filteredScenarios.map((sc, idx) => {
                  const isSelected = selectedScenarioId === sc.id;
                  const scMode = getScenarioMode(sc);
                  const modeBadge =
                    scMode === 'MODE_A_ADMIN'
                      ? { label: isFa ? 'اداری (A)' : 'Admin (A)', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
                      : scMode === 'MODE_C_CONFLICT'
                      ? { label: isFa ? 'تعارض و اخلاق (C)' : 'Conflict (C)', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' }
                      : { label: isFa ? 'عامیانه و OTC (B)' : 'OTC / Slang (B)', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };

                  const titleClean = getCleanTitle(sc);
                  const presentationClean = getCleanPresentation(sc);

                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        onSelectScenario(sc.id);
                        setIsAccordionOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-right transition flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-600/25 border-sky-500 text-white shadow-md ring-1 ring-sky-500/60'
                          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/90 text-slate-300 hover:border-sky-500/40'
                      }`}
                    >
                      <div className="space-y-1 overflow-hidden flex-1">
                        <div className="font-bold text-xs text-slate-100 leading-snug line-clamp-1">
                          <span className="text-sky-400 ml-1 font-mono">{idx + 1}.</span>
                          {titleClean}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          <span className="text-sky-300 font-medium">{sc.patientProfile.name}</span>
                          <span className="mx-1 text-slate-600">•</span>
                          <span>{presentationClean}</span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-sky-500 text-black flex items-center justify-center font-bold shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-sky-500 flex items-center justify-center text-slate-500">
                            <MessageSquare className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full p-6 text-center text-xs app-muted">
                  {isFa ? 'هیچ سناریویی یافت نشد.' : 'No matching scenarios found.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
