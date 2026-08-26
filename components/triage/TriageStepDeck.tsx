'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scenario, WwhamQuestion, DialogueOption } from '@/data/otcScenarios';
import { Language, DiseaseInfo } from '@/types/pharmacy';
import { FormattedClinicalText } from './FormattedClinicalText';
import { FrameworkTabs } from './FrameworkTabs';
import { OutcomeFeedbackCard } from './OutcomeFeedbackCard';
import { ChatMessage, StarredPhrase } from './types';
import { haptic } from '@/lib/haptics';
import {
  UserRound,
  Pill,
  MessagesSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  HelpCircle,
  Lightbulb,
  Stethoscope,
  HeartPulse,
  BookOpen,
} from 'lucide-react';

interface TriageStepDeckProps {
  language: Language;
  scenario: Scenario;
  linkedHandbookDisease: any;
  onOpenDiseaseModal: (d: DiseaseInfo) => void;
  // Framework props
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
  // Chat & Starred props
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
  starredPhrases,
  toggleStarMessage,
  isMessageStarred,
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

  // 3 Steps:
  // 0: مشخصات و شرایط بالینی بیمار (Patient Profile & Direct Request)
  // 1: داروهای قفسه OTC و پاپ‌آپ دارو (OTC Shelf Medicines & In-Page Modal)
  // 2: مشاوره، عبارات پرکاربرد انگلیسی و سوالات بالینی (Consultation, Phrases & Clinical Framework)
  const [verticalStep, setVerticalStep] = useState<0 | 1 | 2>(0);

  // In-Page Drug Monograph Modal State (allows viewing drug and closing without leaving page)
  const [selectedMedicineModal, setSelectedMedicineModal] = useState<any | null>(null);

  // Local state for copy feedback inside phrases list
  const [copiedPhraseText, setCopiedPhraseText] = useState<string | null>(null);

  const handleCopyPhrase = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPhraseText(text);
      haptic.success();
      setTimeout(() => setCopiedPhraseText(null), 2000);
    } catch {
      // Fallback
    }
  };

  const medicinesList = linkedHandbookDisease?.medicines || [];

  return (
    <div className="space-y-4">
      {/* 1. TOP 3-STEP NAVIGATION DECK BAR */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-md text-xs">
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
          <UserRound className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{isFa ? '۱. مشخصات و شرح حال' : '1. Patient Profile'}</span>
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
          <span className="truncate">{isFa ? '۲. داروهای قفسه OTC' : '2. OTC Medicines'}</span>
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
          <span className="truncate">{isFa ? '۳. مشاوره و اصطلاحات' : '3. Consultation & Phrases'}</span>
        </button>
      </div>

      {/* 2. MAIN CARD VIEW CONTAINER */}
      <div className="relative min-h-[350px]">
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* STEP 0: PATIENT PROFILE, DIRECT REQUEST & CLINICAL CONTEXT */}
          {/* ========================================================================= */}
          {verticalStep === 0 && (
            <motion.div
              key="triage-step-0-patient-profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 select-text"
            >
              {/* Main Patient Presentation & Request Card */}
              <div className="app-card border border-sky-500/30 rounded-2xl p-4 sm:p-5 shadow-lg bg-gradient-to-b from-sky-950/20 via-slate-900/90 to-slate-950/90 space-y-4">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      <UserRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white leading-tight">
                        {scenario.patientProfile.name}
                      </h3>
                      <p className="text-xs text-sky-300 font-mono mt-0.5">
                        {scenario.patientProfile.age} {isFa ? 'ساله' : 'yo'} • {scenario.patientProfile.gender}
                      </p>
                    </div>
                  </div>

                  {linkedHandbookDisease && (
                    <button
                      type="button"
                      onClick={() => onOpenDiseaseModal(linkedHandbookDisease)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isFa ? 'راهنمای بالینی بیماری' : 'Disease Guide'}</span>
                    </button>
                  )}
                </div>

                {/* Primary Patient Presentation & Request */}
                <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                    <span className="flex items-center gap-1.5">
                      <MessagesSquare className="w-4 h-4 text-sky-400" />
                      <span>{isFa ? 'شرح حال، سوال و خواسته اصلی بیمار:' : 'Chief Presentation & Patient Request:'}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200">
                      Direct Request
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed bg-black/40 p-3 rounded-xl border border-sky-500/20">
                    {isFa ? scenario.patientProfile.presentation.fa : scenario.patientProfile.presentation.en}
                  </p>

                  {isFa && scenario.patientProfile.presentation.en && (
                    <p className="text-xs text-sky-300/90 font-mono leading-relaxed px-1" dir="ltr">
                      &ldquo;{scenario.patientProfile.presentation.en}&rdquo;
                    </p>
                  )}
                </div>

                {/* Demographics & Medical History Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isFa ? 'سوابق پزشکی (History):' : 'Medical History:'}</span>
                    </span>
                    <p className="text-slate-200 font-medium">
                      {scenario.patientProfile.medicalHistory && scenario.patientProfile.medicalHistory.length > 0
                        ? scenario.patientProfile.medicalHistory.join(' • ')
                        : isFa ? 'سوابق خاصی گزارش نشده است' : 'Nil significant'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-teal-400" />
                      <span>{isFa ? 'داروهای مصرفی فعلی:' : 'Current Medications:'}</span>
                    </span>
                    <p className="text-slate-200 font-medium">
                      {scenario.patientProfile.currentMedications && scenario.patientProfile.currentMedications.length > 0
                        ? scenario.patientProfile.currentMedications.join(' • ')
                        : isFa ? 'داروی خاصی مصرف نمی‌کند' : 'None reported'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isFa ? 'حساسیت‌های دارویی (Allergies):' : 'Allergies:'}</span>
                    </span>
                    <p className="text-slate-200 font-medium">
                      {scenario.patientProfile.allergies && scenario.patientProfile.allergies.length > 0
                        ? scenario.patientProfile.allergies.join(' • ')
                        : isFa ? 'حساسیت دارویی شناخته‌شده ندارد (NKDA)' : 'No Known Drug Allergies (NKDA)'}
                    </p>
                  </div>
                </div>

                {/* Aussie Slang in this Presentation (if available) */}
                {scenario.aussieContext && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <span>🦘</span>
                      <span>{isFa ? 'اصطلاحات عامیانه استرالیایی و زمینه فرهنگی بیمار:' : 'Aussie Slang & Cultural Context:'}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-amber-500/20">
                      {isFa ? scenario.aussieContext.fa : scenario.aussieContext.en}
                    </p>
                  </div>
                )}

                {/* Non-Pharmacological & Self-Care Advice */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'توصیه‌های غیردارویی و خودمراقبتی برای این بیمار:' : 'Non-Pharmacological & Supportive Care:'}</span>
                  </div>
                  <p className="text-xs sm:text-[12.5px] text-slate-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-emerald-500/20">
                    {isFa
                      ? (linkedHandbookDisease?.nonPharmAdvice?.join('\n') || scenario.clinicalOutcome?.explanation?.fa || scenario.clinicalOutcome?.recommendation?.fa)
                      : (linkedHandbookDisease?.nonPharmAdvice?.join('\n') || scenario.clinicalOutcome?.explanation?.en || scenario.clinicalOutcome?.recommendation?.en)}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Navigation to OTC Medicines */}
              <button
                type="button"
                onClick={() => {
                  haptic.light();
                  setVerticalStep(1);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 cursor-pointer transition"
              >
                <Pill className="w-4 h-4" />
                <span>{isFa ? 'مشاهده داروهای پیشنهادی قفسه OTC ←' : 'View Recommended OTC Medicines →'}</span>
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: OTC MEDICINES WITH IN-PAGE MONOGRAPH MODAL */}
          {/* ========================================================================= */}
          {verticalStep === 1 && (
            <motion.div
              key="triage-step-1-otc-medicines"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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
                <span className="text-[11px] text-slate-400">
                  {isFa ? 'برای مشاهده جزئیات روی هر دارو کلیک کنید' : 'Click on any drug to view monograph'}
                </span>
              </div>

              {medicinesList.length === 0 ? (
                <div className="app-card border app-border rounded-2xl p-6 text-center app-muted text-xs space-y-2 bg-slate-900/60">
                  <Pill className="w-8 h-8 mx-auto text-slate-600" />
                  <p>{isFa ? 'داروی بدون نسخه اختصاصی برای این سناریو ثبت نشده است.' : 'No specific OTC medicine listed for this scenario.'}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {medicinesList.map((med: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => {
                        haptic.light();
                        setSelectedMedicineModal(med);
                      }}
                      className="p-3.5 rounded-2xl app-card border border-teal-500/30 hover:border-teal-400 bg-slate-900/80 hover:bg-slate-800/80 space-y-2 transition cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center text-xs font-bold group-hover:scale-105 transition">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight group-hover:text-teal-300 transition">
                              {med.name}
                            </h4>
                            <p className="text-[11px] text-teal-400/90 font-mono">
                              {med.brandExamples}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-300 font-bold border border-teal-500/30 flex items-center gap-1 group-hover:bg-teal-500/25">
                          <span>{isFa ? 'مشاهده مونوگراف' : 'View Profile'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>

                      {/* Brief preview */}
                      <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 text-xs text-slate-300">
                        <span className="text-teal-400 font-bold">💊 {isFa ? 'دوز مصرف:' : 'Dose:'} </span>
                        <span>{med.dosing}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* In-Page Medicine Monograph Popup Modal */}
              <AnimatePresence>
                {selectedMedicineModal && (
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 15 }}
                      className="w-full max-w-lg max-h-[85vh] overflow-y-auto app-card border border-teal-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl bg-slate-950 space-y-4 select-text"
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white leading-tight">
                              {selectedMedicineModal.name}
                            </h3>
                            <p className="text-xs text-teal-300 font-mono mt-0.5">
                              {selectedMedicineModal.brandExamples}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedMedicineModal(null)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="space-y-3 text-xs sm:text-sm text-slate-200">
                        {/* Dosing */}
                        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-teal-500/20 space-y-1">
                          <span className="text-teal-400 font-bold flex items-center gap-1.5">
                            <Pill className="w-4 h-4" />
                            <span>{isFa ? 'دوزینگ و دستور مصرف استاندارد:' : 'Standard Dosing & Administration:'}</span>
                          </span>
                          <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed">
                            {selectedMedicineModal.dosing}
                          </p>
                        </div>

                        {/* Counseling & Pearls */}
                        {selectedMedicineModal.counselingPoints && selectedMedicineModal.counselingPoints.length > 0 && (
                          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                            <span className="text-amber-300 font-bold flex items-center gap-1.5">
                              <Lightbulb className="w-4 h-4 text-amber-400" />
                              <span>{isFa ? 'نکات مهم مشاوره‌ای و مصرف:' : 'Key Clinical Pearls:'}</span>
                            </span>
                            <ul className="space-y-1 text-xs sm:text-[12.5px] text-slate-300 list-disc list-inside leading-relaxed">
                              {selectedMedicineModal.counselingPoints.map((pt: string, pIdx: number) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* CAL Warning Labels (if any) */}
                        {selectedMedicineModal.calLabels && selectedMedicineModal.calLabels.length > 0 && (
                          <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                            <span className="text-amber-300 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              <span>{isFa ? 'برچسب‌های هشدار اختصاصی (CAL Labels):' : 'Cautionary Advisory Labels (CAL):'}</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedMedicineModal.calLabels.map((c: string) => (
                                <span key={c} className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        {onNavigateToModule && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMedicineModal(null);
                              onNavigateToModule(2);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{isFa ? 'مشاهده در قفسه اصلی' : 'Open in Shelf'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedMedicineModal(null)}
                          className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
                        >
                          {isFa ? 'بستن' : 'Close'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Bottom Quick Navigation */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setVerticalStep(0);
                  }}
                  className="text-sky-400 hover:text-sky-300 font-bold cursor-pointer"
                >
                  {isFa ? '← بازگشت به مشخصات بیمار' : '← Patient Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setVerticalStep(2);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{isFa ? 'مشاوره و عبارات پرکاربرد ←' : 'Consultation & Phrases →'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: CONSULTATION, KEY ENGLISH PHRASES & STREAMLINED FRAMEWORK */}
          {/* ========================================================================= */}
          {verticalStep === 2 && (
            <motion.div
              key="triage-step-2-consultation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 select-text"
            >
              {/* 1. KEY ENGLISH CONSULTATION PHRASES & AUSSIE SLANG CARD */}
              <div className="app-card border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg bg-gradient-to-b from-purple-950/20 via-slate-900/90 to-slate-950/90 space-y-3.5">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <MessagesSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {isFa ? 'کلمات و عبارات پرکاربرد انگلیسی در این باره' : 'Key English Consultation Phrases'}
                      </h3>
                      <p className="text-[11px] text-purple-300">
                        {isFa ? 'جملات طلایی و سوالات کلیدی داروساز برای این سناریو (کلیک جهت کپی):' : 'Essential pharmacist consultation phrases (click to copy):'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    High Yield
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* WWHAM Question Phrases */}
                  {scenario.whatQuestions.map((q) => (
                    <div
                      key={q.key}
                      onClick={() => handleCopyPhrase(q.question.en)}
                      className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-purple-500/20 hover:border-purple-400/50 space-y-1.5 cursor-pointer transition group shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-purple-300 font-bold text-[11px]">
                          [{q.key}]
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 group-hover:text-purple-300">
                          {copiedPhraseText === q.question.en ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> کپی شد
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Copy
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="font-medium text-white text-xs leading-relaxed" dir="ltr">
                        &ldquo;{q.question.en}&rdquo;
                      </p>
                      {isFa && (
                        <p className="text-[11.5px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-1">
                          {q.question.fa}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. STREAMLINED CLINICAL FRAMEWORK TABS (WWHAM POPUP BUTTONS, RED FLAGS LIST, DECISION) */}
              <div className="app-card border app-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm bg-slate-900/80">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
