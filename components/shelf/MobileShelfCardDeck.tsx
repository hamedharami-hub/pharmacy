'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SubCategory, ClinicalDomain, Product } from '@/types/shelf';
import { Language, DiseaseInfo } from '@/types/pharmacy';
import { FormattedClinicalText } from './FormattedClinicalText';
import { getDiseasesForSubCategory } from '@/data/shelf/diseaseHelpers';
import { ShelfDrugCard } from './ShelfDrugCard';
import { haptic } from '@/lib/haptics';
import {
  Lightbulb,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Pill,
  Activity,
  Layers,
  ArrowLeft,
  Search,
} from 'lucide-react';

import { CAL_LABELS_DICT } from '@/data/shelf/calLabels';

interface MobileShelfCardDeckProps {
  activeDomain: ClinicalDomain;
  activeSubCat: SubCategory;
  products: Product[];
  language: Language;
  onOpenSelector: () => void;
  onSelectDisease: (d: DiseaseInfo) => void;
  onSelectProduct: (p: Product) => void;
  onSelectSchedule?: (schedule: string) => void;
  onSelectMechanism?: (mech: any) => void;
  onSelectCalInfo?: (cal: any) => void;
  onSelectConceptId?: (conceptId: string) => void;
  onOpenProjectStop?: (prod: Product) => void;
  onNavigateToModule?: (moduleNumber: 1 | 2 | 3 | 4 | 5 | 6, contextId?: string) => void;
  onOpenAiLeitner?: (text: string, module: 1 | 2 | 4, category?: string, topic?: string) => void;
}

export const MobileShelfCardDeck: React.FC<MobileShelfCardDeckProps> = ({
  activeDomain,
  activeSubCat,
  products,
  language,
  onOpenSelector,
  onSelectDisease,
  onSelectProduct,
  onSelectSchedule,
  onSelectMechanism,
  onSelectCalInfo,
  onSelectConceptId,
  onOpenProjectStop,
  onNavigateToModule,
  onOpenAiLeitner,
}) => {
  const isFa = language === 'fa';
  const relatedDiseases = getDiseasesForSubCategory(activeSubCat.id);

  // Deck State:
  // Step 0: Clinical Specifications (Horizontal Swipe between Pearls=0, Rules=1, RedFlags=2)
  // Step 1: Related Diseases & Treatment Matrix
  // Step 2: Medicines / Drugs on the Shelf
  const [verticalStep, setVerticalStep] = useState<0 | 1 | 2>(0);
  const [horizontalSpecTab, setHorizontalSpecTab] = useState<0 | 1 | 2>(0); // 0: Pearls, 1: Rules, 2: Red Flags
  const [currentDrugIndex, setCurrentDrugIndex] = useState(0);

  // Drag tracking for touch gestures
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (elapsed > 600) return; // ignore long presses

    const threshold = 40;

    // Horizontal Swipe (Left/Right)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (verticalStep === 0) {
        // Clinical Spec Step
        if (deltaX < 0) {
          // Swipe Left -> next spec
          if (horizontalSpecTab < 2) {
            haptic.light();
            setHorizontalSpecTab((prev) => (prev + 1) as 0 | 1 | 2);
          }
        } else {
          // Swipe Right -> previous spec
          if (horizontalSpecTab > 0) {
            haptic.light();
            setHorizontalSpecTab((prev) => (prev - 1) as 0 | 1 | 2);
          }
        }
      } else if (verticalStep === 2 && products.length > 1) {
        // Medicines Step (Swipe between drugs)
        if (deltaX < 0) {
          if (currentDrugIndex < products.length - 1) {
            haptic.light();
            setCurrentDrugIndex((prev) => prev + 1);
          }
        } else {
          if (currentDrugIndex > 0) {
            haptic.light();
            setCurrentDrugIndex((prev) => prev - 1);
          }
        }
      }
    }
    // Vertical Swipe (Up/Down)
    else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
      if (deltaY < 0) {
        // Swipe Up -> Next Vertical Step
        if (verticalStep < 2) {
          haptic.light();
          setVerticalStep((prev) => (prev + 1) as 0 | 1 | 2);
        }
      } else {
        // Swipe Down -> Previous Vertical Step (or back to selector if on step 0)
        if (verticalStep > 0) {
          haptic.light();
          setVerticalStep((prev) => (prev - 1) as 0 | 1 | 2);
        } else {
          // On step 0, swipe down opens selector
          haptic.light();
          onOpenSelector();
        }
      }
    }
  };

  const pearls = isFa ? activeSubCat.clinicalPearlsFa : activeSubCat.clinicalPearlsEn;
  const rules = isFa ? activeSubCat.schedulingRulesFa : activeSubCat.schedulingRulesEn;
  const flags = isFa ? activeSubCat.redFlagsFa : activeSubCat.redFlagsEn;

  return (
    <div
      className="space-y-3 select-none pb-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. COMPACT TOP CONTROLLER BAR */}
      <div className="app-card border app-border rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
        {/* Active Title Pill */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-black app-text truncate leading-tight">
              {isFa ? activeSubCat.titleFa : activeSubCat.titleEn}
            </h3>
            <p className="text-[10px] app-muted truncate" dir="ltr">
              {activeDomain.titleEn}
            </p>
          </div>
        </div>

        {/* Change Selector Button */}
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onOpenSelector();
          }}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{isFa ? 'تغییر سرفصل' : 'Change'}</span>
        </button>
      </div>

      {/* 2. VERTICAL STEPPER TABS (3 MAIN PHASES) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/20 dark:bg-slate-900 border app-border text-xs">
        <button
          type="button"
          onClick={() => {
            haptic.light();
            setVerticalStep(0);
          }}
          className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            verticalStep === 0
              ? 'bg-sky-600 text-white shadow-xs'
              : 'app-muted hover:app-text'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isFa ? '۱. نکات و قوانین' : '1. Profile'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            setVerticalStep(1);
          }}
          className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            verticalStep === 1
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'app-muted hover:app-text'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>{isFa ? '۲. بیماری‌ها' : '2. Diseases'}</span>
          <span className="text-[10px] font-mono opacity-80">({relatedDiseases.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            setVerticalStep(2);
          }}
          className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
            verticalStep === 2
              ? 'bg-teal-600 text-white shadow-xs'
              : 'app-muted hover:app-text'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>{isFa ? '۳. قفسه داروها' : '3. Shelf'}</span>
          <span className="text-[10px] font-mono opacity-80">({products.length})</span>
        </button>
      </div>

      {/* 3. CARD VIEW CONTAINER WITH SMOOTH ANIMATIONS */}
      <div className="relative min-h-[380px]">
        <AnimatePresence mode="wait">
          {/* STEP 0: CLINICAL SPECIFICATIONS CARDS (PEARLS, RULES, RED FLAGS) */}
          {verticalStep === 0 && (
            <motion.div
              key={`spec-step-${horizontalSpecTab}`}
              initial={{ opacity: 0, x: horizontalSpecTab === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: horizontalSpecTab === 0 ? 20 : -20 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-3"
            >
              {/* Horizontal Tabs: [ 💡 نکات | 🛡️ قوانین | 🚨 علائم هشدار ] */}
              <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setHorizontalSpecTab(0);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    horizontalSpecTab === 0
                      ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{isFa ? '💡 نکات بالینی' : 'Pearls'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setHorizontalSpecTab(1);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    horizontalSpecTab === 1
                      ? 'bg-indigo-500 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isFa ? '🛡️ قوانین SUSMP' : 'Rules'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setHorizontalSpecTab(2);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    horizontalSpecTab === 2
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isFa ? '🚨 علائم هشدار' : 'Red Flags'}</span>
                </button>
              </div>

              {/* CARD 0: Clinical Pearls */}
              {horizontalSpecTab === 0 && (
                <div className="app-card border border-sky-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md bg-linear-to-b from-sky-950/20 to-transparent">
                  <div className="flex items-center justify-between border-b border-sky-500/20 pb-2.5">
                    <div className="flex items-center gap-2 text-sky-400 font-black text-sm">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>{isFa ? 'نکات کلیدی بالینی (Clinical Pearls)' : 'Clinical Pearls'}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                      {pearls.length} {isFa ? 'نکته' : 'items'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {pearls.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl app-card border border-sky-500/20 flex items-start gap-2.5 leading-relaxed text-xs sm:text-sm app-text shadow-xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                        <div className="flex-1 leading-relaxed">
                          <FormattedClinicalText text={item} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Horizontal Gesture Helper */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t app-border">
                    <span className="flex items-center gap-1 text-indigo-300 font-medium">
                      <span>{isFa ? '← کشیدن به چپ: قوانین SUSMP' : 'Swipe Left: SUSMP Rules →'}</span>
                    </span>
                    <span className="text-slate-500">1 / 3</span>
                  </div>
                </div>
              )}

              {/* CARD 1: Scheduling Rules */}
              {horizontalSpecTab === 1 && (
                <div className="app-card border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md bg-linear-to-b from-indigo-950/20 to-transparent">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                    <div className="flex items-center gap-2 text-indigo-400 font-black text-sm">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>{isFa ? 'قوانین جدول‌بندی دارویی (SUSMP)' : 'Scheduling Rules'}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                      SUSMP
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl app-card border border-indigo-500/20 text-xs sm:text-sm app-text leading-relaxed shadow-xs">
                    <FormattedClinicalText text={rules} />
                  </div>

                  {/* Horizontal Gesture Helper */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t app-border">
                    <button
                      type="button"
                      onClick={() => setHorizontalSpecTab(0)}
                      className="text-sky-300 font-medium cursor-pointer"
                    >
                      {isFa ? '→ نکات بالینی' : '← Pearls'}
                    </button>
                    <span className="text-slate-500">2 / 3</span>
                    <button
                      type="button"
                      onClick={() => setHorizontalSpecTab(2)}
                      className="text-rose-300 font-medium cursor-pointer"
                    >
                      {isFa ? '← علائم هشدار' : 'Red Flags →'}
                    </button>
                  </div>
                </div>
              )}

              {/* CARD 2: Red Flags */}
              {horizontalSpecTab === 2 && (
                <div className="app-card border border-rose-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md bg-linear-to-b from-rose-950/20 to-transparent">
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
                    <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>{isFa ? 'علائم خط قرمز و ارجاع فوری (Red Flags)' : 'Red Flags & Referrals'}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      {flags.length} {isFa ? 'مورد' : 'flags'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {flags.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/25 flex items-start gap-2.5 leading-relaxed text-xs sm:text-sm text-rose-200 shadow-xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <div className="flex-1 leading-relaxed">
                          <FormattedClinicalText text={item} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Horizontal Gesture Helper */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t app-border">
                    <button
                      type="button"
                      onClick={() => setHorizontalSpecTab(1)}
                      className="text-indigo-300 font-medium cursor-pointer"
                    >
                      {isFa ? '→ قوانین SUSMP' : '← SUSMP Rules'}
                    </button>
                    <span className="text-slate-500">3 / 3</span>
                  </div>
                </div>
              )}

              {/* Bottom Quick Jump Button to Step 1 */}
              <button
                type="button"
                onClick={() => {
                  haptic.light();
                  setVerticalStep(1);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition cursor-pointer"
              >
                <span>{isFa ? 'مشاهده بیماری‌های مرتبط و پروتکل‌ها' : 'View Related Diseases & Protocols'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 1: RELATED DISEASES & TREATMENT PROTOCOLS */}
          {verticalStep === 1 && (
            <motion.div
              key="diseases-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              <div className="app-card border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'بیماری‌های مرتبط با این سرفصل' : 'Related Clinical Diseases'}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                    {relatedDiseases.length} {isFa ? 'بیماری' : 'diseases'}
                  </span>
                </div>

                {relatedDiseases.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    {isFa ? 'هیچ پروتکل بیماری مستقیمی ثبت نشده است.' : 'No direct clinical diseases mapped.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {relatedDiseases.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          haptic.light();
                          onSelectDisease(d);
                        }}
                        className="w-full p-3 rounded-xl bg-slate-900/80 hover:bg-emerald-950/60 border border-slate-700/60 hover:border-emerald-500/50 text-start transition flex items-center justify-between gap-2.5 cursor-pointer group shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-white group-hover:text-emerald-300 truncate">
                              {isFa ? d.name.fa : d.name.en}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5" dir="ltr">
                              {d.name.en}
                            </p>
                          </div>
                        </div>

                        <div className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 text-[11px] font-bold shrink-0 flex items-center gap-1 group-hover:bg-emerald-600 group-hover:text-white transition">
                          <span>{isFa ? 'پروتکل' : 'View'}</span>
                          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 rotate-180" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVerticalStep(0)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>{isFa ? 'بازگشت به نکات بالینی' : 'Back to Profile'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerticalStep(2)}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  <span>{isFa ? 'رفتن به قفسه داروها' : 'Go to Medicines'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: MEDICINES ON THE SHELF (SWIPEABLE DRUG CARDS) */}
          {verticalStep === 2 && (
            <motion.div
              key="medicines-step"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold app-text px-1">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <Pill className="w-4 h-4" />
                  <span>
                    {isFa
                      ? `داروهای قفسه (${products.length} دارو)`
                      : `Shelf Medicines (${products.length})`}
                  </span>
                </span>
                {products.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {currentDrugIndex + 1} / {products.length}
                  </span>
                )}
              </div>

              {products.length === 0 ? (
                <div className="app-card border app-border rounded-2xl p-8 text-center app-muted text-xs space-y-2">
                  <Pill className="w-8 h-8 mx-auto text-slate-600" />
                  <p>{isFa ? 'دارویی در این زیرمجموعه یافت نشد.' : 'No medicines in this subcategory.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Active Full Drug Card */}
                  {products[currentDrugIndex] && (
                    <div className="relative">
                      <ShelfDrugCard
                        prod={products[currentDrugIndex]}
                        language={language}
                        calLabelsDict={CAL_LABELS_DICT}
                        onSelectSchedule={onSelectSchedule || (() => {})}
                        onSelectMechanism={onSelectMechanism || (() => {})}
                        onSelectCalInfo={onSelectCalInfo || (() => {})}
                        onSelectConceptId={onSelectConceptId || (() => {})}
                        onOpenProjectStop={() => onOpenProjectStop && onOpenProjectStop(products[currentDrugIndex])}
                        onOpenAiLeitner={onOpenAiLeitner}
                        onNavigateToModule={onNavigateToModule}
                      />
                    </div>
                  )}

                  {/* Horizontal Drug Pagination Slider */}
                  {products.length > 1 && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentDrugIndex > 0) {
                            haptic.light();
                            setCurrentDrugIndex((prev) => prev - 1);
                          }
                        }}
                        disabled={currentDrugIndex === 0}
                        className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                          currentDrugIndex > 0
                            ? 'bg-slate-800 text-teal-300 hover:bg-slate-700'
                            : 'opacity-30 cursor-not-allowed'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4 rtl:rotate-0 rotate-180" />
                        <span>{isFa ? 'داروی قبلی' : 'Previous'}</span>
                      </button>

                      {/* Dots Indicator */}
                      <div className="flex items-center gap-1 overflow-x-auto max-w-[150px] no-scrollbar px-1">
                        {products.map((_, idx) => (
                          <span
                            key={idx}
                            onClick={() => {
                              haptic.light();
                              setCurrentDrugIndex(idx);
                            }}
                            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                              idx === currentDrugIndex
                                ? 'w-4 bg-teal-400'
                                : 'bg-slate-700 hover:bg-slate-500'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentDrugIndex < products.length - 1) {
                            haptic.light();
                            setCurrentDrugIndex((prev) => prev + 1);
                          }
                        }}
                        disabled={currentDrugIndex === products.length - 1}
                        className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                          currentDrugIndex < products.length - 1
                            ? 'bg-slate-800 text-teal-300 hover:bg-slate-700'
                            : 'opacity-30 cursor-not-allowed'
                        }`}
                      >
                        <span>{isFa ? 'داروی بعدی' : 'Next'}</span>
                        <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
                      </button>
                    </div>
                  )}

                  {/* Return to specifications button */}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setVerticalStep(0);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <ChevronUp className="w-4 h-4" />
                    <span>{isFa ? 'بازگشت به نکات بالینی سرفصل' : 'Return to Clinical Profile'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
