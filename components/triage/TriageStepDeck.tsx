'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scenario, WwhamQuestion, DialogueOption } from '@/data/otcScenarios';
import { Language, DiseaseInfo } from '@/types/pharmacy';
import { FormattedClinicalText } from './FormattedClinicalText';
import { PatientDemographicsCard } from './PatientDemographicsCard';
import { AussieContextCard } from './AussieContextCard';
import { RedFlagsChecklistCard } from './RedFlagsChecklistCard';
import { FrameworkTabs } from './FrameworkTabs';
import { ChatFeed } from './ChatFeed';
import { OutcomeFeedbackCard } from './OutcomeFeedbackCard';
import { ChatMessage, StarredPhrase } from './types';
import { haptic } from '@/lib/haptics';
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Pill,
  MessagesSquare,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  HelpCircle,
  Stethoscope,
  Info,
} from 'lucide-react';

interface TriageStepDeckProps {
  language: Language;
  scenario: Scenario;
  linkedHandbookDisease: any;
  onOpenDiseaseModal: (d: DiseaseInfo) => void;
  // Step 2 (Consultation / Framework) props
  activeFrameworkTab: 'wwham' | 'redflags' | 'decision';
  setActiveFrameworkTab: (tab: 'wwham' | 'redflags' | 'decision') => void;
  wwhamCount: number;
  askedQuestions: Record<string, boolean>;
  isQnaStarred: (qEn: string) => boolean;
  onAskWwhamQuestion: (q: WwhamQuestion) => void;
  askedRedFlagChecks: Record<string, boolean>;
  onCheckRedFlags: () => void;
  allWwhamAsked: boolean;
  selectedDialogueId: string | null;
  selectedOption: DialogueOption | null | undefined;
  onSelectDialogueOption: (opt: DialogueOption) => void;
  // Chat Feed props
  chatMessages: ChatMessage[];
  isChatExpanded: boolean;
  setIsChatExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  starredPhrases: StarredPhrase[];
  showStarredBelow: boolean;
  setShowStarredBelow: React.Dispatch<React.SetStateAction<boolean>>;
  setShowStarredModal: React.Dispatch<React.SetStateAction<boolean>>;
  toggleStarMessage: (msg: ChatMessage) => void;
  isMessageStarred: (text: string) => boolean;
  removeStarredPhrase: (textEn: string) => void;
  onCopySinglePhrase: (id: string, textEn?: string, textFa?: string) => void;
  copiedPhraseId: string | null;
  onReset: () => void;
  // Outcome props
  showOutcome: boolean;
  onOpenReferralModal: () => void;
  onNavigateToFred?: (scenarioId?: string) => void;
  onNavigateToModule?: (moduleNumber: 1 | 2 | 3 | 4 | 5 | 6, contextId?: string) => void;
  onOpenAiLeitner?: (text: string, module: 1 | 2 | 4, category?: string, topic?: string) => void;
}

export const TriageStepDeck: React.FC<TriageStepDeckProps> = ({
  language,
  scenario,
  linkedHandbookDisease,
  onOpenDiseaseModal,
  activeFrameworkTab,
  setActiveFrameworkTab,
  wwhamCount,
  askedQuestions,
  isQnaStarred,
  onAskWwhamQuestion,
  askedRedFlagChecks,
  onCheckRedFlags,
  allWwhamAsked,
  selectedDialogueId,
  selectedOption,
  onSelectDialogueOption,
  chatMessages,
  isChatExpanded,
  setIsChatExpanded,
  starredPhrases,
  showStarredBelow,
  setShowStarredBelow,
  setShowStarredModal,
  toggleStarMessage,
  isMessageStarred,
  removeStarredPhrase,
  onCopySinglePhrase,
  copiedPhraseId,
  onReset,
  showOutcome,
  onOpenReferralModal,
  onNavigateToFred,
  onNavigateToModule,
  onOpenAiLeitner,
}) => {
  const isFa = language === 'fa';

  // 3-Step Deck State (matching Shelves architecture)
  // Step 0: Protocol & Clinical Safety (Tabs: WWHAM=0, RedFlags=1, Safety=2, NonPharm=3)
  // Step 1: Recommended OTC Medicines & Shelf Integration
  // Step 2: Live Patient Consultation Simulator & Chat
  const [verticalStep, setVerticalStep] = useState<0 | 1 | 2>(0);
  const [horizontalSpecTab, setHorizontalSpecTab] = useState<0 | 1 | 2 | 3>(0);

  const medicinesList = linkedHandbookDisease?.medicines || [];

  return (
    <div className="space-y-3">
      {/* 1. TOP 3-STEP NAVIGATION DECK BAR */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-md text-xs">
        <button
          type="button"
          onClick={() => {
            haptic.light();
            setVerticalStep(0);
          }}
          className={`py-2 px-2 sm:px-3 rounded-xl font-black transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
            verticalStep === 0
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isFa ? '۱. پروتکل و ارزیابی' : '1. Protocol & Safety'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            setVerticalStep(1);
          }}
          className={`py-2 px-2 sm:px-3 rounded-xl font-black transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
            verticalStep === 1
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Pill className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isFa ? '۲. داروهای قفسه' : '2. OTC Medicines'}</span>
          {medicinesList.length > 0 && (
            <span className="text-[9.5px] font-mono opacity-80">({medicinesList.length})</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.light();
            setVerticalStep(2);
          }}
          className={`py-2 px-2 sm:px-3 rounded-xl font-black transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px] sm:text-xs ${
            verticalStep === 2
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessagesSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isFa ? '۳. شبیه‌ساز مکالمه' : '3. Consultation'}</span>
        </button>
      </div>

      {/* 2. MAIN CARD VIEW CONTAINER WITH ANIMATIONS */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* STEP 0: PROTOCOL & CLINICAL SPECIFICATIONS (WWHAM, RED FLAGS, SAFETY, NON-PHARM) */}
          {verticalStep === 0 && (
            <motion.div
              key={`triage-step-0-${horizontalSpecTab}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="space-y-3"
            >
              {/* Horizontal Tabs: [ 📋 WWHAM & Profile | 🚨 Red Flags | 🛡️ Safety & Rules | 🌿 Non-Pharm ] */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setHorizontalSpecTab(0);
                  }}
                  className={`py-1.5 rounded-lg font-bold transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer ${
                    horizontalSpecTab === 0
                      ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isFa ? 'شرح حال و WWHAM' : 'WWHAM'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setHorizontalSpecTab(1);
                  }}
                  className={`py-1.5 rounded-lg font-bold transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer ${
                    horizontalSpecTab === 1
                      ? 'bg-rose-600 text-white font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isFa ? 'پرچم‌های قرمز' : 'Red Flags'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setHorizontalSpecTab(2);
                  }}
                  className={`py-1.5 rounded-lg font-bold transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer ${
                    horizontalSpecTab === 2
                      ? 'bg-indigo-500 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isFa ? 'ایمنی و بارداری' : 'Safety'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setHorizontalSpecTab(3);
                  }}
                  className={`py-1.5 rounded-lg font-bold transition flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 cursor-pointer ${
                    horizontalSpecTab === 3
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isFa ? 'توصیه‌های خانگی' : 'Non-Pharm'}</span>
                </button>
              </div>

              {/* CARD 0: WWHAM & Patient Demographics */}
              {horizontalSpecTab === 0 && (
                <div className="space-y-3 select-text">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                    <PatientDemographicsCard
                      language={language}
                      scenario={scenario}
                      linkedHandbookDisease={linkedHandbookDisease}
                      onOpenDiseaseModal={onOpenDiseaseModal}
                    />
                    <AussieContextCard
                      language={language}
                      scenario={scenario}
                    />
                  </div>

                  {/* WWHAM Quick Framework Box */}
                  <div className="p-3.5 rounded-2xl app-card border border-sky-500/25 bg-slate-900/60 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-400 border-b border-sky-500/15 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span>{isFa ? 'پروتکل استاندارد ارزیابی WWHAM استرالیا' : 'Standard WWHAM Assessment Protocol'}</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">
                        PSA Practice Standard
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      <div className="p-2 rounded-xl bg-black/40 border border-slate-800 space-y-0.5">
                        <span className="text-sky-300 font-bold font-mono">W - Who is it for?</span>
                        <p className="text-[11px] text-slate-400">
                          {isFa ? 'بیمار اصلی کیست؟ (سن، بارداری، شیردهی و اطفال)' : 'Who is the patient? (Age, pregnancy, breastfeeding)'}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-black/40 border border-slate-800 space-y-0.5">
                        <span className="text-sky-300 font-bold font-mono">W - What are the symptoms?</span>
                        <p className="text-[11px] text-slate-400">
                          {isFa ? 'ماهیت، محل، شدت و ویژگی‌های دقیق علائم' : 'Exact nature, location, severity, and characteristics'}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-black/40 border border-slate-800 space-y-0.5">
                        <span className="text-sky-300 font-bold font-mono">H - How long present?</span>
                        <p className="text-[11px] text-slate-400">
                          {isFa ? 'مدت زمان شروع و سیر حاد یا مزمن بودن بیماری' : 'Duration and progression of the condition'}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-black/40 border border-slate-800 space-y-0.5">
                        <span className="text-sky-300 font-bold font-mono">A & M - Action & Medication</span>
                        <p className="text-[11px] text-slate-400">
                          {isFa ? 'داروهای مصرفی قبلی و سوابق دارویی/بیماری زمینه‌ای' : 'Treatments already tried & current regular medications'}
                        </p>
                      </div>
                    </div>

                    {/* Step Navigation Footer */}
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t app-border">
                      <span className="text-slate-500 font-mono text-[11px]">1 / 4</span>
                      <button
                        type="button"
                        onClick={() => {
                          haptic.light();
                          setHorizontalSpecTab(1);
                        }}
                        className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isFa ? 'مشاهده پرچم‌های قرمز ←' : 'Red Flags →'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 1: Red Flags & Urgent Referral */}
              {horizontalSpecTab === 1 && (
                <div className="space-y-3 select-text">
                  <RedFlagsChecklistCard
                    language={language}
                    scenario={scenario}
                  />

                  <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-rose-300 font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>{isFa ? 'اقدام فوری داروساز در صورت وجود پرچم قرمز:' : 'Immediate Pharmacist Action on Red Flags:'}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={onCheckRedFlags}
                        className="py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-600/30"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>
                          {askedRedFlagChecks['rf-check']
                            ? (isFa ? 'مشاهده پاپ‌آپ پرچم‌های قرمز 🚩' : 'Open Red Flags Popup 🚩')
                            : (isFa ? 'اجرای غربالگری پرچم‌های قرمز' : 'Screen Red Flags')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={onOpenReferralModal}
                        className="py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-slate-900 hover:bg-slate-800 text-rose-300 border-rose-500/40"
                      >
                        <FileText className="w-4 h-4 text-rose-400" />
                        <span>{isFa ? '📄 صدور برگه ارجاع به GP' : '📄 Generate GP Referral Letter'}</span>
                      </button>
                    </div>

                    {/* Step Navigation Footer */}
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-rose-500/20">
                      <button
                        type="button"
                        onClick={() => setHorizontalSpecTab(0)}
                        className="text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                      >
                        {isFa ? '← شرح حال و WWHAM' : '← WWHAM'}
                      </button>
                      <span className="text-slate-500 font-mono text-[11px]">2 / 4</span>
                      <button
                        type="button"
                        onClick={() => setHorizontalSpecTab(2)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      >
                        {isFa ? 'ایمنی و بارداری →' : 'Safety Rules →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 2: Safety Rules & Special Populations */}
              {horizontalSpecTab === 2 && (
                <div className="app-card border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md bg-linear-to-b from-indigo-950/20 to-transparent select-text">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2.5">
                    <div className="flex items-center gap-2 text-indigo-400 font-black text-sm">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span>{isFa ? 'ایمنی دارویی و گروه‌های آسیب‌پذیر' : 'Safety & Special Populations'}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                      TGA / APF Rules
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-1">
                      <span className="font-bold text-indigo-300 flex items-center gap-1">
                        🤰 {isFa ? 'بارداری و شیردهی:' : 'Pregnancy & Lactation:'}
                      </span>
                      <p className="text-slate-300 text-[11.5px] leading-relaxed">
                        {isFa
                          ? 'بررسی دقیق رده‌بندی TGA (Category A تا X). پرهیز از NSAIDs در سه‌ماهه سوم بارداری؛ پاراستامول داروی خط اول انتخابی است.'
                          : 'Check TGA Pregnancy Categories. Avoid NSAIDs in the 3rd trimester. Paracetamol remains the safest first-line analgesic.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-1">
                      <span className="font-bold text-indigo-300 flex items-center gap-1">
                        👶 {isFa ? 'اطفال و دوز بر اساس وزن:' : 'Paediatrics & Weight Dosing:'}
                      </span>
                      <p className="text-slate-300 text-[11.5px] leading-relaxed">
                        {isFa
                          ? 'محاسبه دقیق دوز بر حسب میلی‌گرم بر کیلوگرم (mg/kg) نه بر اساس سن. پرهیز از آسپرین در کودکان (خطر سندرم ری).'
                          : 'Always calculate paediatric doses by exact weight (mg/kg) rather than age. Avoid aspirin in children due to Reye’s syndrome.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-1">
                      <span className="font-bold text-indigo-300 flex items-center gap-1">
                        👵 {isFa ? 'سالمندان و کلیرانس کلیوی:' : 'Elderly & Renal Clearance:'}
                      </span>
                      <p className="text-slate-300 text-[11.5px] leading-relaxed">
                        {isFa
                          ? 'احتیاط در مصرف داروهای آنتی‌کولینرژیک، آرام‌بخش و NSAIDs به دلیل خطر سقوط، گیجی و آسیب حاد کلیوی.'
                          : 'Caution with anticholinergics and NSAIDs due to elevated fall risk, confusion, and acute kidney injury.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-1">
                      <span className="font-bold text-indigo-300 flex items-center gap-1">
                        ⚡ {isFa ? 'تداخلات دارویی مهم:' : 'Critical Drug Interactions:'}
                      </span>
                      <p className="text-slate-300 text-[11.5px] leading-relaxed">
                        {isFa
                          ? 'بررسی همزمانی با وارفارین، داروهای قلبی، لیتیوم و داروهای با پنجره درمانی باریک (NTI).'
                          : 'Screen for interactions with warfarin, DOACs, ACEIs, lithium, and other Narrow Therapeutic Index medicines.'}
                      </p>
                    </div>
                  </div>

                  {/* Step Navigation Footer */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t app-border">
                    <button
                      type="button"
                      onClick={() => setHorizontalSpecTab(1)}
                      className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                    >
                      {isFa ? '← پرچم‌های قرمز' : '← Red Flags'}
                    </button>
                    <span className="text-slate-500 font-mono text-[11px]">3 / 4</span>
                    <button
                      type="button"
                      onClick={() => setHorizontalSpecTab(3)}
                      className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                    >
                      {isFa ? 'توصیه‌های خانگی →' : 'Non-Pharm →'}
                    </button>
                  </div>
                </div>
              )}

              {/* CARD 3: Non-Pharmacological Advice */}
              {horizontalSpecTab === 3 && (
                <div className="app-card border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md bg-linear-to-b from-emerald-950/20 to-transparent select-text">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>{isFa ? 'توصیه‌های غیردارویی و مراقبت در منزل (Self-Care)' : 'Non-Pharmacological & Self-Care Advice'}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Counseling
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <p className="font-bold text-emerald-300 mb-1.5">
                        {isFa ? '🌿 اصول مراقبت حمایتی داروساز برای این بیمار:' : '🌿 Core supportive care advice:'}
                      </p>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {isFa
                          ? (linkedHandbookDisease?.nonPharmAdvice?.join('\n') || scenario.clinicalOutcome?.explanation?.fa || scenario.clinicalOutcome?.recommendation?.fa)
                          : (linkedHandbookDisease?.nonPharmAdvice?.join('\n') || scenario.clinicalOutcome?.explanation?.en || scenario.clinicalOutcome?.recommendation?.en)}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{isFa ? 'پیگیری بالینی و زمان مراجعه مجدد:' : 'Clinical Follow-up & Red-Flag Return:'}</span>
                      </span>
                      <p className="text-[11.5px] text-slate-400">
                        {isFa
                          ? 'در صورتی که علائم طی ۴۸ تا ۷۲ ساعت بهبود نیافت یا بدتر شد، مراجعه به پزشک الزامی است.'
                          : 'Advise patient to consult a doctor if symptoms worsen or fail to improve within 48 to 72 hours.'}
                      </p>
                    </div>
                  </div>

                  {/* Step Navigation Footer */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t app-border">
                    <button
                      type="button"
                      onClick={() => setHorizontalSpecTab(2)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                    >
                      {isFa ? '← ایمنی و بارداری' : '← Safety'}
                    </button>
                    <span className="text-slate-500 font-mono text-[11px]">4 / 4</span>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setVerticalStep(1);
                      }}
                      className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isFa ? 'مشاهده داروهای قفسه ←' : 'OTC Medicines →'}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: RECOMMENDED OTC MEDICINES & SHELF INTEGRATION */}
          {verticalStep === 1 && (
            <motion.div
              key="triage-step-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="space-y-3 select-text"
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Pill className="w-4 h-4" />
                  <span>
                    {isFa
                      ? `داروهای پیشنهادی OTC برای این سناریو (${medicinesList.length} دارو):`
                      : `Recommended OTC Medicines (${medicinesList.length}):`}
                  </span>
                </span>

                {onNavigateToModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateToModule(2)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isFa ? 'مشاهده کامل در ماژول قفسه' : 'Open in Shelf Module'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {medicinesList.length === 0 ? (
                <div className="app-card border app-border rounded-2xl p-6 text-center app-muted text-xs space-y-2 bg-slate-900/60">
                  <Pill className="w-8 h-8 mx-auto text-slate-600" />
                  <p>{isFa ? 'داروی بدون نسخه اختصاصی برای این سناریو تعریف نشده است؛ به بخش مشاوره و ارجاع مراجعه فرمایید.' : 'No specific OTC drug listed for this scenario. Refer to consultation protocol.'}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {medicinesList.map((med: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl app-card border border-teal-500/25 bg-slate-900/80 space-y-2 hover:border-teal-500/40 transition shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {med.name}
                            </h4>
                            <p className="text-[11px] text-teal-300/90 font-mono">
                              {med.brandExamples}
                            </p>
                          </div>
                        </div>

                        {onNavigateToModule && (
                          <button
                            type="button"
                            onClick={() => onNavigateToModule(2)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isFa ? 'قفسه' : 'Shelf'}</span>
                            <ExternalLink className="w-3 h-3 text-teal-400" />
                          </button>
                        )}
                      </div>

                      {/* Dosing & Instructions */}
                      <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 text-xs text-slate-200 space-y-1">
                        <div className="text-[11.5px] text-slate-300 flex items-start gap-1.5">
                          <span className="text-teal-400 font-bold shrink-0">💊 {isFa ? 'دوزینگ و نحوه مصرف:' : 'Dosing:'}</span>
                          <span className="flex-1">{med.dosing}</span>
                        </div>

                        {med.counselingPoints && med.counselingPoints.length > 0 && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                            <span className="text-amber-400 font-medium">{isFa ? 'نکات کلیدی:' : 'Key Pearls:'} </span>
                            <span>{med.counselingPoints[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step Navigation Footer */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setVerticalStep(0);
                  }}
                  className="text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                >
                  {isFa ? '← بازگشت به پروتکل و ایمنی' : '← Protocol & Safety'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setVerticalStep(2);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{isFa ? 'شروع شبیه‌ساز مکالمه با بیمار ←' : 'Start Consultation →'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LIVE PATIENT CONSULTATION SIMULATOR & CHAT */}
          {verticalStep === 2 && (
            <motion.div
              key="triage-step-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22 }}
              className="space-y-4 select-text"
            >
              <div className="app-card border app-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm bg-slate-900/70">
                <FrameworkTabs
                  language={language}
                  scenario={scenario}
                  activeFrameworkTab={activeFrameworkTab}
                  setActiveFrameworkTab={setActiveFrameworkTab}
                  wwhamCount={wwhamCount}
                  askedQuestions={askedQuestions}
                  isQnaStarred={isQnaStarred}
                  onAskWwhamQuestion={onAskWwhamQuestion}
                  askedRedFlagChecks={askedRedFlagChecks}
                  onCheckRedFlags={onCheckRedFlags}
                  allWwhamAsked={allWwhamAsked}
                  selectedDialogueId={selectedDialogueId}
                  selectedOption={selectedOption || undefined}
                  onSelectDialogueOption={onSelectDialogueOption}
                />

                <ChatFeed
                  language={language}
                  scenario={scenario}
                  chatMessages={chatMessages}
                  isChatExpanded={isChatExpanded}
                  setIsChatExpanded={setIsChatExpanded}
                  starredPhrases={starredPhrases}
                  showStarredBelow={showStarredBelow}
                  setShowStarredBelow={setShowStarredBelow}
                  setShowStarredModal={setShowStarredModal}
                  toggleStarMessage={toggleStarMessage}
                  isMessageStarred={isMessageStarred}
                  removeStarredPhrase={removeStarredPhrase}
                  onCopySinglePhrase={onCopySinglePhrase}
                  copiedPhraseId={copiedPhraseId}
                  onReset={onReset}
                />
              </div>

              {/* Outcome Feedback Card */}
              {showOutcome && (
                <OutcomeFeedbackCard
                  language={language}
                  scenario={scenario}
                  selectedOption={selectedOption || undefined}
                  onOpenReferralModal={onOpenReferralModal}
                  onNavigateToFred={onNavigateToFred}
                  onNavigateToModule={onNavigateToModule}
                  onOpenAiLeitner={onOpenAiLeitner}
                />
              )}

              {/* Return to specifications button */}
              <button
                type="button"
                onClick={() => {
                  haptic.light();
                  setVerticalStep(0);
                }}
                className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                <ChevronUp className="w-4 h-4" />
                <span>{isFa ? 'بازگشت به پروتکل و مشخصات بالینی' : 'Return to Protocol & Clinical Specs'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
