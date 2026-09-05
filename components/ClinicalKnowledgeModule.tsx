'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  Language,
  ModuleId,
  LayoutMode,
  FlagColor,
  CustomCardEdit,
} from '@/types/pharmacy';
import { ALL_PHARMACY_CARDS } from '@/lib/pharmacy-data';
import { StudyCard } from '@/components/StudyCard';
import { FredDispenseModule } from '@/components/FredDispenseModule';
import { useStudyTrackerContext } from './study/StudyTrackerContext';
import { ResumeStudyBanner } from './study/ResumeStudyBanner';
import {
  BookOpen,
  Check,
  FolderOpen,
  Monitor,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState, ModuleSearchField, StageEnterButton, StageSelectorCard } from '@/components/ui';

interface ClinicalKnowledgeModuleProps {
  language: Language;
  activeModule: ModuleId;
  onSelectModule: (m: ModuleId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  flagFilter: FlagColor | 'ALL';
  onSelectFlagFilter: (f: FlagColor | 'ALL') => void;
  flags: Record<string, FlagColor>;
  deleted: string[];
  customEdits: Record<string, CustomCardEdit>;
  reviewedCards: Record<string, boolean>;
  savedNotes: Record<string, string[]>;
  onToggleReview: (id: string) => void;
  onSetFlag: (id: string, color?: FlagColor) => void;
  onEditCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onSaveNote: (cardId: string, text: string) => void;
  onDeleteNote: (cardId: string, idx: number) => void;
  layoutMode: LayoutMode;
  onNavigateToModule?: (moduleNumber: 1 | 2 | 3 | 4 | 5 | 6, scenarioId?: string) => void;
  onOpenAiLeitner?: (text: string, module: 1 | 2 | 4, category?: string, topic?: string) => void;
}

const cardContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

const cardSlideVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 22,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280,
      mass: 0.75,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -12,
    transition: {
      duration: 0.16,
      ease: 'easeOut',
    },
  },
};

export const ClinicalKnowledgeModule: React.FC<ClinicalKnowledgeModuleProps> = ({
  language,
  activeModule,
  onSelectModule,
  searchQuery,
  onSearchChange,
  activeCategory,
  flags,
  deleted,
  customEdits,
  reviewedCards,
  savedNotes,
  onToggleReview,
  onSetFlag,
  onEditCard,
  onDeleteCard,
  onSaveNote,
  onDeleteNote,
  layoutMode,
  onNavigateToModule,
  onOpenAiLeitner,
}) => {
  const isFa = language === 'fa';
  const [isTopicSelectorOpen, setIsTopicSelectorOpen] = useState(false);
  const { getLastStudied } = useStudyTrackerContext();
  const lastStudiedInMod4 = getLastStudied(4);

  // Category chips: First chip is "نرم‌افزار" (Fred Dispense), then other clinical/dispensing categories
  const categoryChips: Array<{
    id: ModuleId;
    name: { fa: string; en: string };
    icon?: LucideIcon;
    isSoftware?: boolean;
  }> = [
    { id: 'software', name: { fa: 'نرم‌افزار', en: 'Software' }, icon: Monitor, isSoftware: true },
    { id: 'ALL', name: { fa: 'همه سرفصل‌ها', en: 'All Topics' } },
    { id: 'mod6', name: { fa: 'نسخه‌پیچی و دیسپنس', en: 'Prescription & PBS' } },
    { id: 'mod2', name: { fa: 'قوانین و جدول‌بندی', en: 'Legislation & Schedules' } },
    { id: 'mod1', name: { fa: 'سیستم سلامت استرالیا', en: 'Healthcare System' } },
    { id: 'mod4', name: { fa: 'خدمات بالینی و BPMH', en: 'Clinical Services & BPMH' } },
    { id: 'mod3', name: { fa: 'داروهای بدون نسخه و بیماری‌ها', en: 'OTC & Disease Management' } },
    { id: 'mod5', name: { fa: 'گزارش‌نویسی و مقالات', en: 'Academic Writing & Reports' } },
  ];

  // Filter cards in real time (when not on software tab)
  const filteredCards = ALL_PHARMACY_CARDS.filter((item) => {
    if (deleted.includes(item.id)) return false;
    if (activeModule !== 'ALL' && activeModule !== 'software' && item.module !== activeModule) return false;
    if (activeCategory !== 'ALL' && item.category[language] !== activeCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (customEdits[item.id]?.title || item.title[language]).toLowerCase();
      const pearl = (customEdits[item.id]?.pearl || item.actionPearl[language]).toLowerCase();
      const details = (customEdits[item.id]?.summary || item.detailsHtml[language]).toLowerCase();
      return title.includes(q) || pearl.includes(q) || details.includes(q);
    }

    return true;
  });

  const selectedChip = categoryChips.find((chip) => chip.id === activeModule) || categoryChips[0];
  const isSearching = searchQuery.trim().length > 0;
  const selectorOpen = isTopicSelectorOpen && !isSearching;
  const selectedTopicCount =
    selectedChip.id === 'software'
      ? undefined
      : ALL_PHARMACY_CARDS.filter(
          (item) =>
            !deleted.includes(item.id) &&
            (selectedChip.id === 'ALL' || item.module === selectedChip.id)
        ).length;

  return (
    <div className="space-y-5">
      {/* Resume Study Banner for Module 4 */}
      {lastStudiedInMod4 && activeModule !== 'software' && (
        <ResumeStudyBanner
          language={language}
          lastStudied={lastStudiedInMod4}
          currentModuleId={4}
          onResume={(item) => {
            if (item.routeContext?.moduleId) {
              onSelectModule(item.routeContext.moduleId as ModuleId);
            }
          }}
        />
      )}

      {/* TOPIC SELECTOR AND SEARCH */}
      <div className="space-y-3">
        {activeModule !== 'software' && (
          <ModuleSearchField
            value={searchQuery}
            onChange={onSearchChange}
            language={language}
            placeholder={{
              fa: 'جستجو در مباحث، کلمات کلیدی، کدهای PBS و قوانین ایالتی...',
              en: 'Search across topics, PBS codes, SUSMP schedules & state laws...',
            }}
          />
        )}

        <StageSelectorCard
          icon={selectedChip.icon || (selectedChip.isSoftware ? Monitor : BookOpen)}
          title={selectedChip.name}
          count={selectedTopicCount}
          changeLabel={{ fa: 'تغییر سرفصل', en: 'Change Topic' }}
          isOpen={selectorOpen}
          onToggle={() => setIsTopicSelectorOpen((value) => !value)}
          language={language}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categoryChips.map((chip) => {
              const Icon = chip.icon || (chip.isSoftware ? Monitor : BookOpen);
              const isSelected = activeModule === chip.id;
              const topicCount =
                chip.id === 'software'
                  ? undefined
                  : ALL_PHARMACY_CARDS.filter(
                      (item) =>
                        !deleted.includes(item.id) &&
                        (chip.id === 'ALL' || item.module === chip.id)
                    ).length;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onSelectModule(chip.id)}
                  className={`group text-start p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                    isSelected
                      ? chip.isSoftware
                        ? 'border-teal-500/60 ring-2 ring-teal-500/20 bg-teal-500/10 text-teal-950 dark:text-teal-100 font-bold shadow-sm scale-[1.01]'
                        : 'border-indigo-500/60 ring-2 ring-indigo-500/20 bg-indigo-500/10 text-indigo-950 dark:text-indigo-100 font-bold shadow-sm scale-[1.01]'
                      : 'app-border hover:border-slate-400/40 bg-black/5 dark:bg-slate-900/40 hover:bg-black/10 dark:hover:bg-slate-800/60 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isSelected
                          ? chip.isSoftware
                            ? 'bg-teal-500/15 text-teal-500'
                            : 'bg-indigo-500/15 text-indigo-500'
                          : 'bg-black/5 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-tight truncate app-text">
                        {chip.name[language]}
                      </p>
                      {chip.name.en !== chip.name[language] && (
                        <p className="text-[10px] app-muted truncate opacity-80 mt-0.5" dir="ltr">
                          {chip.name.en}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {typeof topicCount === 'number' && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full app-border border app-muted">
                        {topicCount}
                      </span>
                    )}
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <StageEnterButton
            icon={Sparkles}
            label={{ fa: '✨ مشاهده کارت‌های این سرفصل (View Cards)', en: '✨ View Topic Cards' }}
            onClick={() => setIsTopicSelectorOpen(false)}
            language={language}
          />
        </StageSelectorCard>
      </div>

      {/* 3. CONTENT DISPLAY: EITHER SOFTWARE (FRED DISPENSE) OR CARDS */}
      {!selectorOpen && activeModule === 'software' ? (
        <div className="space-y-4">
          <FredDispenseModule language={language} onNavigateToModule={onNavigateToModule} />
        </div>
      ) : !selectorOpen ? (
        /* STUDY CARDS DIRECT DISPLAY */
        <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredCards.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyState
                icon={FolderOpen}
                title={{
                  fa: 'هیچ سرفصلی مطابق با فیلترها و جستجوی شما یافت نشد.',
                  en: 'No study topics found matching your search criteria.',
                }}
                language={language}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`cards-grid-${activeModule}-${activeCategory}-${searchQuery}`}
              variants={cardContainerVariants}
              initial="hidden"
              animate="visible"
              className={
                layoutMode === 'window-grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-3.5'
                  : 'space-y-3'
              }
            >
              {filteredCards.map((card) => (
                <motion.div
                  key={card.id}
                  variants={cardSlideVariants}
                  className="relative group"
                >
                  <StudyCard
                    item={card}
                    language={language}
                    flag={flags[card.id] || null}
                    customEdit={customEdits[card.id]}
                    isReviewed={!!reviewedCards[card.id]}
                    savedNotes={savedNotes[card.id] || []}
                    onToggleReview={onToggleReview}
                    onSetFlag={onSetFlag}
                    onEdit={onEditCard}
                    onDelete={onDeleteCard}
                    onSaveNote={onSaveNote}
                    onDeleteNote={onDeleteNote}
                    layoutMode={layoutMode}
                    onOpenAiLeitner={onOpenAiLeitner}
                  />

                  {/* Interactive Shortcut Launcher Buttons on Study Cards */}
                  {onNavigateToModule && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] px-3 py-2 rounded-xl bg-black/20 border app-border">
                      <span className="app-muted font-semibold">{isFa ? 'تمرین تعاملی این مبحث:' : 'Interactive Scenario Link:'}</span>
                      
                      {card.module === 'mod3' || card.id.includes('m3') || card.title.en.includes('OTC') ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToModule(1, 'cough-triage')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold hover:bg-emerald-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          ⚡ {isFa ? 'اجرا در شبیه‌ساز تریاژ OTC (Module 1)' : 'Try in OTC Triage (Mod 1)'}
                        </button>
                      ) : null}

                      {card.module === 'mod2' || card.id.includes('m2') || card.title.en.includes('S3') || card.title.en.includes('Pseudoephedrine') ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToModule(2)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600/30 text-sky-300 border border-sky-500/40 font-bold hover:bg-sky-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          🏷️ {isFa ? 'بررسی در قفسه محصولات S3 (Module 2)' : 'Check in Product Shelf (Mod 2)'}
                        </button>
                      ) : null}

                      {card.module === 'mod6' || card.id.includes('m6') || card.title.en.includes('Prescription') || card.title.en.includes('Fred') || card.title.en.includes('Reg 24') ? (
                        <button
                          type="button"
                          onClick={() => onNavigateToModule(3)}
                          className="px-2.5 py-1 rounded-lg bg-teal-600/30 text-teal-300 border border-teal-500/40 font-bold hover:bg-teal-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
                        >
                          🖥️ {isFa ? 'تمرین نسخه در Fred Dispense (Module 3)' : 'Practice in Fred Dispense (Mod 3)'}
                        </button>
                      ) : null}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      ) : null}
  </div>
);
};
