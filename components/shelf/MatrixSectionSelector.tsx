'use client';

import React, { useState } from 'react';
import { Language } from '@/types/pharmacy';
import { Check, ChevronDown, ChevronUp, FolderTree } from 'lucide-react';
import { haptic } from '@/lib/haptics';

export type MatrixSectionId = 'ANTIMICROBIAL' | 'VACCINE' | 'MONITORING_TDM' | 'PREGNANCY_SAFETY';

export interface MatrixTopic {
  id: string;
  titleFa: string;
  titleEn: string;
  searchText: string;
}

export interface MatrixSection {
  id: MatrixSectionId;
  titleFa: string;
  titleEn: string;
  icon: React.ElementType;
  palette: 'sky' | 'purple' | 'emerald' | 'amber';
  topics: MatrixTopic[];
}

export interface MatrixSectionSelectorProps {
  sections: MatrixSection[];
  selectedSectionId: MatrixSectionId;
  onSelectSection: (id: MatrixSectionId) => void;
  language: Language;
  queryActive: boolean;
  matchCounts: Record<MatrixSectionId, number>;
}

interface SectionStyleConfig {
  iconBg: string;
  iconColor: string;
  activeBorder: string;
  activeBg: string;
  badgeBg: string;
  badgeText: string;
}

const SECTION_STYLES: Record<MatrixSection['palette'], SectionStyleConfig> = {
  sky: {
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-500 dark:text-sky-400',
    activeBorder: 'border-sky-500/60 ring-2 ring-sky-500/20',
    activeBg: 'bg-sky-500/10 text-sky-950 dark:text-sky-100',
    badgeBg: 'bg-sky-500/20',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-500 dark:text-purple-400',
    activeBorder: 'border-purple-500/60 ring-2 ring-purple-500/20',
    activeBg: 'bg-purple-500/10 text-purple-950 dark:text-purple-100',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    activeBorder: 'border-emerald-500/60 ring-2 ring-emerald-500/20',
    activeBg: 'bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-500 dark:text-amber-400',
    activeBorder: 'border-amber-500/60 ring-2 ring-amber-500/20',
    activeBg: 'bg-amber-500/10 text-amber-950 dark:text-amber-100',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
};

export const MatrixSectionSelector: React.FC<MatrixSectionSelectorProps> = ({
  sections,
  selectedSectionId,
  onSelectSection,
  language,
  queryActive,
  matchCounts,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFa = language === 'fa';
  const selectedSection = sections.find((section) => section.id === selectedSectionId) || sections[0];
  const selectedStyle = selectedSection ? SECTION_STYLES[selectedSection.palette] : SECTION_STYLES.sky;
  const SelectedIcon = selectedSection?.icon || FolderTree;

  return (
    <div className="space-y-2">
      {!isExpanded && selectedSection && (
        <div className="app-card border app-border rounded-2xl overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              setIsExpanded(true);
            }}
            className="w-full text-start p-3 sm:p-3.5 app-bg hover:bg-black/5 dark:hover:bg-slate-900 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 select-none"
            title={isFa ? 'کلیک کنید تا تمام سرفصل‌ها نمایش داده شوند' : 'Click to show all protocol sections'}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${selectedStyle.iconBg}`}>
                <SelectedIcon className={`w-4 h-4 ${selectedStyle.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-black leading-tight app-text truncate">
                  {isFa ? selectedSection.titleFa : selectedSection.titleEn}
                </h4>
                <p className="text-[10px] app-muted truncate opacity-80 mt-0.5" dir="ltr">
                  {selectedSection.titleEn}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {queryActive && matchCounts[selectedSection.id] > 0 && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  {matchCounts[selectedSection.id]}
                </span>
              )}
              <div className="px-2 py-1 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center gap-1 transition">
                <span>{isFa ? 'تغییر سرفصل' : 'Change Section'}</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </div>
            </div>
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b app-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-500">
                <FolderTree className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs sm:text-sm font-black app-text">
                {isFa ? 'انتخاب سرفصل پروتکل بالینی:' : 'Select Clinical Protocol Section:'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                haptic.light();
                setIsExpanded(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>{isFa ? 'بستن منو' : 'Collapse'}</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {sections.map((section) => {
              const isSelected = section.id === selectedSectionId;
              const style = SECTION_STYLES[section.palette];
              const Icon = section.icon;
              const topicCount = section.topics.filter((topic) => topic.id !== 'ALL').length;
              const matchCount = matchCounts[section.id];

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    haptic.light();
                    onSelectSection(section.id);
                    setIsExpanded(false);
                  }}
                  className={`group text-start p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 select-none relative overflow-hidden ${
                    isSelected
                      ? `${style.activeBorder} ${style.activeBg} font-bold shadow-sm scale-[1.01]`
                      : 'app-border hover:border-slate-400/40 bg-black/5 dark:bg-slate-900/40 hover:bg-black/10 dark:hover:bg-slate-800/60 opacity-85 hover:opacity-100'
                  } ${queryActive && matchCount === 0 ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isSelected ? style.iconBg : 'bg-black/5 dark:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? style.iconColor : 'text-slate-400 group-hover:text-slate-200'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold leading-tight truncate ${isSelected ? 'app-text font-black' : 'app-text'}`}>
                        {isFa ? section.titleFa : section.titleEn}
                      </p>
                      <p className="text-[10px] app-muted truncate opacity-80 mt-0.5" dir="ltr">
                        {section.titleEn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? `${style.badgeBg} ${style.badgeText}` : 'bg-black/10 dark:bg-slate-800 app-muted'
                      }`}
                    >
                      {topicCount}
                    </span>
                    {queryActive && matchCount > 0 && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        {matchCount}
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
