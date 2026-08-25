'use client';

import React from 'react';
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
  Search,
  BookOpen,
  FolderOpen,
  Monitor,
  Sparkles,
} from 'lucide-react';

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
  const { getLastStudied } = useStudyTrackerContext();
  const lastStudiedInMod4 = getLastStudied(4);

  // Category chips: First chip is "نرم‌افزار" (Fred Dispense), then other clinical/dispensing categories
  const categoryChips: Array<{
    id: ModuleId;
    name: { fa: string; en: string };
    icon?: any;
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

      {/* UNIFIED MODULE 4 HEADER BAR */}
      <div className="app-card border app-border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* 1. TOP ROW: Brand & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b app-border pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-300 flex items-center justify-center shadow-xs shrink-0 border border-teal-500/30">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black app-text tracking-tight">
                  {isFa
                    ? 'ماژول ۴: نسخه‌پیچی (Dispensing) و قوانین استرالیا'
                    : 'Module 4: Prescription Dispensing & Practice'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  {activeModule === 'software'
                    ? isFa ? 'نرم‌افزار Fred Dispense' : 'Fred Dispense Software'
                    : isFa ? `${filteredCards.length} مبحث و کارت بالینی` : `${filteredCards.length} Clinical Topics`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. REAL-TIME SEARCH BAR (IF ON KNOWLEDGE TABS) & SUBMODULE CATEGORY CHIPS */}
        <div className="space-y-3">
          {/* Submodule Category Chips 1 to 6 (First is "نرم‌افزار") */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categoryChips.map((chip) => {
              const Icon = chip.icon;
              const isSelected = activeModule === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => onSelectModule(chip.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap border flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? chip.isSoftware
                        ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                        : 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : chip.isSoftware
                      ? 'bg-teal-500/15 border-teal-500/30 text-teal-800 dark:text-teal-300 hover:bg-teal-500/25'
                      : 'app-bg app-border app-muted hover:app-text'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{chip.name[language]}</span>
                </button>
              );
            })}
          </div>

          {/* Real-Time Search Input (Displayed when browsing knowledge cards) */}
          {activeModule !== 'software' && (
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={
                  isFa
                    ? 'جستجوی آنی در تمام مباحث، کلمات کلیدی، کدهای PBS و قوانین ایالتی...'
                    : 'Real-time quick search across all topics, PBS codes, SUSMP schedules & state laws...'
                }
                className="w-full pr-10 pl-4 py-2 rounded-xl border app-border bg-black/30 text-xs app-text focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. CONTENT DISPLAY: EITHER SOFTWARE (FRED DISPENSE) OR CARDS */}
      {activeModule === 'software' ? (
        <div className="space-y-4">
          <FredDispenseModule language={language} onNavigateToModule={onNavigateToModule} />
        </div>
      ) : (
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
              className="p-12 text-center app-card border app-border rounded-3xl app-muted space-y-3"
            >
              <FolderOpen className="w-10 h-10 mx-auto text-slate-500" />
              <p className="text-xs sm:text-sm">
                {isFa
                  ? 'هیچ سرفصلی مطابق با فیلترها و جستجوی شما یافت نشد.'
                  : 'No study topics found matching your search criteria.'}
              </p>
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
    )}
  </div>
);
};

