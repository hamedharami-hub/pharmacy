'use client';

import React, { startTransition, useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { OTC_SCENARIOS, Scenario, WwhamQuestion, DialogueOption, ConversationMode } from '@/data/otcScenarios';
import { DiseaseInfo, DISEASES_REGISTRY, findDiseaseGuide } from '@/data/diseasesRegistry';
import {
  OtcTriageModuleProps,
  ChatMessage,
  StarredPhrase,
  getScenarioMode,
  ModeSelectorBar,
  TriageStepDeck,
} from './triage';
import { UnifiedCategorySelector } from './triage/UnifiedCategorySelector';
import { UnifiedDiseaseExplorer } from './triage/UnifiedDiseaseExplorer';
import { SPECIAL_TRIAGE_CATEGORIES, hasTriageScenario, getDiseaseForScenario } from '@/lib/diseaseTriageBridge';
import { matchDiseaseToSubcategory } from '@/lib/diseaseSubcategories';
import { haptic } from '@/lib/haptics';
import { getTriageScenarioId } from '@/lib/triageNavigation';
import { ArrowLeft, BookOpen, Flag, Sparkles, Stethoscope } from 'lucide-react';
import { useStudyTrackerContext } from './study/StudyTrackerContext';
import { ClinicalRelationsPanel } from './ClinicalRelationsPanel';

const DiseaseDetailModal = dynamic(
  () => import('./DiseaseDetailModal').then((mod) => mod.DiseaseDetailModal),
  { ssr: false }
);

const WwhamQuestionModal = dynamic(
  () => import('./triage').then((mod) => mod.WwhamQuestionModal),
  { ssr: false }
);

const RedFlagsModal = dynamic(
  () => import('./triage').then((mod) => mod.RedFlagsModal),
  { ssr: false }
);

const ReferralLetterModal = dynamic(
  () => import('./triage').then((mod) => mod.ReferralLetterModal),
  { ssr: false }
);

const StarredPhrasesModal = dynamic(
  () => import('./triage').then((mod) => mod.StarredPhrasesModal),
  { ssr: false }
);

export const OtcTriageModule: React.FC<OtcTriageModuleProps> = ({
  language,
  onNavigateToFred,
  onNavigateToModule,
  onOpenAiLeitner,
  targetContext,
  onClearTargetContext,
}) => {
  const isFa = language === 'fa';
  const { markItemViewed, setItemCompleted, getItemFlag, setItemFlag, isViewed } = useStudyTrackerContext();

  // Module View: 'diseases' (catalog of clinical diseases & special categories) or 'simulator' (interactive case dialogue)
  const [activeView, setActiveView] = useState<'diseases' | 'simulator'>('diseases');

  // Disease exploration state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('ALL');
  const [triageOnlyFilter, setTriageOnlyFilter] = useState<boolean>(false);
  const [diseaseSearchQuery, setDiseaseSearchQuery] = useState<string>('');

  // Mode and scenario state for simulator
  const [selectedConversationMode, setSelectedConversationMode] = useState<ConversationMode | 'ALL'>('MODE_B_SLANG');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(OTC_SCENARIOS[0].id);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [scenarioSearchTerm, setScenarioSearchTerm] = useState('');
  const [isBrowseOpen, setIsBrowseOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Modals & UI controls
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);

  // Current active scenario in simulator
  const scenario = useMemo(() => {
    return OTC_SCENARIOS.find((s) => s.id === selectedScenarioId) || OTC_SCENARIOS[0];
  }, [selectedScenarioId]);
  const scenarioStudyId = `otc:${scenario.id}`;

  useEffect(() => {
    if (activeView === 'simulator') {
      markItemViewed(1, scenarioStudyId, scenario.title, { fa: 'تریاژ بالینی', en: 'Clinical Triage' }, { mode: getScenarioMode(scenario) });
    }
  }, [activeView, markItemViewed, scenario, scenarioStudyId]);

  // Triage simulator state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: `init-pt-${OTC_SCENARIOS[0].id}`,
      sender: 'patient',
      textEn: OTC_SCENARIOS[0].patientProfile.presentation.en,
      textFa: OTC_SCENARIOS[0].patientProfile.presentation.fa,
      badgeEn: 'Chief Presentation',
      badgeFa: 'شرح اصلی مراجعه',
    },
  ]);
  const [askedQuestions, setAskedQuestions] = useState<Record<string, boolean>>({});
  const [askedRedFlagChecks, setAskedRedFlagChecks] = useState<Record<string, boolean>>({});
  const [selectedDialogueId, setSelectedDialogueId] = useState<string | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const [activeFrameworkTab, setActiveFrameworkTab] = useState<'wwham' | 'redflags' | 'decision'>('wwham');

  const [activeWwhamQuestion, setActiveWwhamQuestion] = useState<WwhamQuestion | null>(null);
  const [showRedFlagsModal, setShowRedFlagsModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Starred phrases state & persistence
  const [starredPhrases, setStarredPhrases] = useState<StarredPhrase[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('otc_triage_starred_phrases');
      if (saved) {
        const parsed = JSON.parse(saved);
        const timer = setTimeout(() => {
          setStarredPhrases(parsed);
        }, 0);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);
  const [showStarredModal, setShowStarredModal] = useState(false);
  const [showStarredBelow, setShowStarredBelow] = useState(false);
  const [starredSearchTerm, setStarredSearchTerm] = useState('');
  const [copiedPhraseId, setCopiedPhraseId] = useState<string | null>(null);

  // Editable GP referral practitioner information
  const [pharmacistName, setPharmacistName] = useState('Pharmacist on Duty, BPharm MPS');
  const [ahpraRegNumber, setAhpraRegNumber] = useState('PHA0001234567');
  const [pharmacyName, setPharmacyName] = useState('Community Care Pharmacy (Sydney, NSW)');
  const [isCopied, setIsCopied] = useState(false);

  // Save starred phrases to localStorage
  const saveStarredPhrases = (newPhrases: StarredPhrase[]) => {
    setStarredPhrases(newPhrases);
    try {
      localStorage.setItem('otc_triage_starred_phrases', JSON.stringify(newPhrases));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Scenario counts per mode
  const { modeACount, modeBCount, modeCCount } = useMemo(() => {
    let a = 0;
    let b = 0;
    let c = 0;
    OTC_SCENARIOS.forEach((s) => {
      const m = getScenarioMode(s);
      if (m === 'MODE_A_ADMIN') a++;
      else if (m === 'MODE_C_CONFLICT') c++;
      else b++;
    });
    return { modeACount: a, modeBCount: b, modeCCount: c };
  }, []);

  // Filtered scenarios for active mode
  const filteredScenarios = useMemo(() => {
    let list = OTC_SCENARIOS;
    if (selectedConversationMode !== 'ALL') {
      list = list.filter((s) => getScenarioMode(s) === selectedConversationMode);
    }
    if (scenarioSearchTerm.trim()) {
      const term = scenarioSearchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.en.toLowerCase().includes(term) ||
          s.title.fa.toLowerCase().includes(term) ||
          s.patientProfile.presentation.en.toLowerCase().includes(term) ||
          s.patientProfile.presentation.fa.toLowerCase().includes(term) ||
          s.category.en.toLowerCase().includes(term)
      );
    }
    if (unreadOnly) list = list.filter((s) => !isViewed(`otc:${s.id}`));
    return list;
  }, [selectedConversationMode, scenarioSearchTerm, unreadOnly, isViewed]);

  // Linked handbook disease for current scenario
  const linkedHandbookDisease = useMemo(() => {
    return findDiseaseGuide(scenario) || getDiseaseForScenario(scenario.id);
  }, [scenario]);

  // Filtered diseases for the Diseases catalog view
  const filteredDiseases = useMemo(() => {
    return DISEASES_REGISTRY.filter((disease) => {
      // 1. Category filter
      if (selectedCategoryId !== 'ALL') {
        if (disease.categoryId !== selectedCategoryId) return false;
      }
      // 2. Subcategory filter
      if (selectedSubCatId !== 'ALL') {
        if (!matchDiseaseToSubcategory(disease, selectedSubCatId)) return false;
      }
      // 3. Triage only checkbox filter
      if (triageOnlyFilter) {
        if (!hasTriageScenario(disease.id)) return false;
      }
      // 4. Search term
      if (diseaseSearchQuery.trim()) {
        const term = diseaseSearchQuery.toLowerCase();
        return (
          disease.name.en.toLowerCase().includes(term) ||
          disease.name.fa.toLowerCase().includes(term) ||
          disease.overview.en.toLowerCase().includes(term) ||
          disease.overview.fa.toLowerCase().includes(term) ||
          disease.synonyms.some((s) => s.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [selectedCategoryId, selectedSubCatId, triageOnlyFilter, diseaseSearchQuery]);

  // Special category (Slang or Admin) if selected
  const activeSpecialCategory = useMemo(() => {
    return SPECIAL_TRIAGE_CATEGORIES.find((c) => c.id === selectedCategoryId) || null;
  }, [selectedCategoryId]);

  const resetScenarioState = useCallback((targetScenario: Scenario) => {
    setAskedQuestions({});
    setAskedRedFlagChecks({});
    setSelectedDialogueId(null);
    setShowOutcome(false);
    setActiveFrameworkTab('wwham');
    setActiveWwhamQuestion(null);
    setShowRedFlagsModal(false);

    setChatMessages([
      {
        id: `init-pt-${Date.now()}`,
        sender: 'patient',
        textEn: targetScenario.patientProfile.presentation.en,
        textFa: targetScenario.patientProfile.presentation.fa,
        badgeEn: 'Chief Presentation',
        badgeFa: 'شرح اصلی مراجعه',
      },
    ]);
  }, []);

  // Open incoming links after render. A triage context always selects its scenario directly.
  useEffect(() => {
    if (!targetContext) return;

    if (targetContext.startsWith('disease:')) {
      const clean = targetContext.replace(/^disease:/, '').toLowerCase();
      const matched = DISEASES_REGISTRY.find(
        (d) =>
          d.id.toLowerCase() === clean ||
          d.name.en.toLowerCase().includes(clean) ||
          d.name.fa.toLowerCase().includes(clean)
      );
      if (matched) {
        startTransition(() => {
          setSelectedDisease(matched);
          setSelectedCategoryId(matched.categoryId);
          setActiveView('diseases');
        });
      }
    } else {
      const scenarioId = getTriageScenarioId(targetContext);
      const matchedScenario = OTC_SCENARIOS.find((s) => s.id === scenarioId);
      if (matchedScenario) {
        startTransition(() => {
          setSelectedScenarioId(matchedScenario.id);
          resetScenarioState(matchedScenario);
          setActiveView('simulator');
        });
      }
    }
    onClearTargetContext?.();
  }, [onClearTargetContext, resetScenarioState, targetContext]);

  const handleSelectScenario = (id: string) => {
    setSelectedScenarioId(id);
    const target = OTC_SCENARIOS.find((s) => s.id === id) || OTC_SCENARIOS[0];
    markItemViewed(1, `otc:${target.id}`, target.title, { fa: 'تریاژ بالینی', en: 'Clinical Triage' }, { mode: getScenarioMode(target) });
    resetScenarioState(target);
  };

  const handleSelectMode = (mode: ConversationMode | 'ALL') => {
    setSelectedConversationMode(mode);
    const firstInMode = OTC_SCENARIOS.find((s) => (mode === 'ALL' ? true : getScenarioMode(s) === mode));
    if (firstInMode) {
      setSelectedScenarioId(firstInMode.id);
      resetScenarioState(firstInMode);
    }
  };

  const handleReset = () => {
    setAskedQuestions({});
    setAskedRedFlagChecks({});
    setSelectedDialogueId(null);
    setShowOutcome(false);
    setActiveFrameworkTab('wwham');
    setActiveWwhamQuestion(null);
    setShowRedFlagsModal(false);

    setChatMessages([
      {
        id: `reset-pt-${Date.now()}`,
        sender: 'patient',
        textEn: scenario.patientProfile.presentation.en,
        textFa: scenario.patientProfile.presentation.fa,
        badgeEn: 'Chief Presentation',
        badgeFa: 'شرح اصلی مراجعه',
      },
    ]);
  };

  // Launch triage directly from disease card
  const handleStartTriageForDisease = (disease: DiseaseInfo, targetScenario: Scenario) => {
    setSelectedScenarioId(targetScenario.id);
    resetScenarioState(targetScenario);
    setActiveView('simulator');
    markItemViewed(1, `otc:${targetScenario.id}`, targetScenario.title, { fa: 'تریاژ بالینی', en: 'Clinical Triage' }, { mode: getScenarioMode(targetScenario) });
  };

  // Launch special slang/admin scenario
  const handleStartSpecialScenario = (targetScenario: Scenario) => {
    setSelectedScenarioId(targetScenario.id);
    resetScenarioState(targetScenario);
    setActiveView('simulator');
    markItemViewed(1, `otc:${targetScenario.id}`, targetScenario.title, { fa: 'تریاژ ویژه', en: 'Special Triage' }, { mode: getScenarioMode(targetScenario) });
  };

  // Starred phrase helpers
  const isMessageStarred = (text: string) => {
    if (!text) return false;
    return starredPhrases.some(
      (p) =>
        (p.textEn && p.textEn === text) ||
        (p.textFa && p.textFa === text) ||
        (p.text && p.text === text) ||
        (p.secondaryText && p.secondaryText === text)
    );
  };

  const isQnaStarred = (qEn: string) => {
    return starredPhrases.some((p) => p.textEn?.includes(qEn) || p.text?.includes(qEn));
  };

  const toggleStarMessage = (msg: ChatMessage) => {
    const textEn = msg.textEn || msg.text || '';
    const textFa = msg.textFa || msg.secondaryText || '';
    const existing = starredPhrases.find(
      (p) =>
        (textEn && p.textEn === textEn) ||
        (textFa && p.textFa === textFa) ||
        (msg.text && p.text === msg.text)
    );

    if (existing) {
      saveStarredPhrases(starredPhrases.filter((p) => p.id !== existing.id));
    } else {
      const newPhrase: StarredPhrase = {
        id: `starred-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        textEn,
        textFa,
        text: textEn,
        secondaryText: textFa,
        sender: msg.sender,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title[language] || scenario.title.en,
        timestamp: Date.now(),
      };
      saveStarredPhrases([newPhrase, ...starredPhrases]);
    }
  };

  const toggleStarQna = (
    qEn: string,
    qFa: string,
    aEn: string,
    aFa: string,
    categoryTitle: string
  ) => {
    const combinedEn = `Q: ${qEn}\nA: ${aEn}`;
    const combinedFa = `پرسش: ${qFa}\nپاسخ: ${aFa}`;
    const existing = starredPhrases.find((p) => p.textEn === combinedEn || p.text === combinedEn);

    if (existing) {
      saveStarredPhrases(starredPhrases.filter((p) => p.id !== existing.id));
    } else {
      const newPhrase: StarredPhrase = {
        id: `starred-qna-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        textEn: combinedEn,
        textFa: combinedFa,
        text: combinedEn,
        secondaryText: combinedFa,
        sender: 'pharmacist',
        scenarioId: scenario.id,
        scenarioTitle: `${scenario.title[language] || scenario.title.en} (${categoryTitle})`,
        timestamp: Date.now(),
      };
      saveStarredPhrases([newPhrase, ...starredPhrases]);
    }
  };

  const toggleStarRedFlags = () => {
    const flagsEn = scenario.redFlags.map((f, i) => `${i + 1}. ${f.en}`).join('\n');
    const flagsFa = scenario.redFlags.map((f, i) => `${i + 1}. ${f.fa}`).join('\n');
    const titleEn = `[Red Flags Check] ${scenario.title.en}:\n${flagsEn}`;
    const titleFa = `[بررسی پرچم‌های قرمز] ${scenario.title.fa}:\n${flagsFa}`;

    const existing = starredPhrases.find((p) => p.textEn === titleEn || p.text === titleEn);
    if (existing) {
      saveStarredPhrases(starredPhrases.filter((p) => p.id !== existing.id));
    } else {
      const newPhrase: StarredPhrase = {
        id: `starred-rf-${Date.now()}`,
        textEn: titleEn,
        textFa: titleFa,
        text: titleEn,
        secondaryText: titleFa,
        sender: 'pharmacist',
        scenarioId: scenario.id,
        scenarioTitle: `${scenario.title[language] || scenario.title.en} (Red Flags)`,
        timestamp: Date.now(),
      };
      saveStarredPhrases([newPhrase, ...starredPhrases]);
    }
  };

  const removeStarredPhrase = (id: string) => {
    saveStarredPhrases(starredPhrases.filter((p) => p.id !== id));
  };

  const clearAllStarredPhrases = () => {
    saveStarredPhrases([]);
  };

  const handleCopySinglePhrase = async (id: string, textEn?: string, textFa?: string) => {
    const textToCopy = isFa ? (textFa || textEn || '') : (textEn || textFa || '');
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedPhraseId(id);
      setTimeout(() => setCopiedPhraseId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // WWHAM Question click
  const handleAskWwhamQuestion = (q: WwhamQuestion) => {
    haptic.light();
    setActiveWwhamQuestion(q);
    if (!askedQuestions[q.key]) {
      setAskedQuestions((prev) => ({ ...prev, [q.key]: true }));

      const qMsg: ChatMessage = {
        id: `rx-wwham-${q.key}-${Date.now()}`,
        sender: 'pharmacist',
        textEn: q.question.en,
        textFa: q.question.fa,
        badgeEn: `WWHAM (${q.key})`,
        badgeFa: `WWHAM (${q.key})`,
      };

      const aMsg: ChatMessage = {
        id: `pt-wwham-${q.key}-${Date.now() + 1}`,
        sender: 'patient',
        textEn: q.answer.en,
        textFa: q.answer.fa,
        badgeEn: `${q.key} Response`,
        badgeFa: `پاسخ ${q.key}`,
      };

      setChatMessages((prev) => [...prev, qMsg, aMsg]);
    }
  };

  // Red Flags Check click
  const handleCheckRedFlags = () => {
    haptic.warning();
    setShowRedFlagsModal(true);
    if (!askedRedFlagChecks['rf-check']) {
      setAskedRedFlagChecks((prev) => ({ ...prev, 'rf-check': true }));

      const rfMsg: ChatMessage = {
        id: `rx-rf-${Date.now()}`,
        sender: 'pharmacist',
        textEn: 'Are there any severe symptoms like chest pain, shortness of breath, or intense radiating pain?',
        textFa: 'آیا علائم هشداردهنده‌ای مانند درد قفسه سینه، تنگی نفس یا درد شدید انتشار‌یابنده دارید؟',
        badgeEn: 'Red Flags Screen',
        badgeFa: 'غربالگری پرچم‌های قرمز',
      };

      const ptResp: ChatMessage = {
        id: `pt-rf-${Date.now() + 1}`,
        sender: 'patient',
        textEn: scenario.patientProfile.presentation.en,
        textFa: scenario.patientProfile.presentation.fa,
        badgeEn: 'Safety Profile',
        badgeFa: 'وضعیت ایمنی بیمار',
      };

      setChatMessages((prev) => [...prev, rfMsg, ptResp]);
    }
  };

  // Pharmacist Decision selection
  const handleSelectDialogueOption = (opt: DialogueOption) => {
    if (opt.isCorrectAdvice) {
      haptic.success();
    } else {
      haptic.warning();
    }
    setSelectedDialogueId(opt.id);
    setShowOutcome(true);
    if (opt.isCorrectAdvice) {
      setItemCompleted(1, scenarioStudyId, true, scenario.title, { fa: 'تریاژ بالینی', en: 'Clinical Triage' });
    }

    const optMsg: ChatMessage = {
      id: `rx-decision-${opt.id}-${Date.now()}`,
      sender: 'pharmacist',
      textEn: opt.text.en,
      textFa: opt.text.fa,
      badgeEn: opt.isCorrectAdvice ? 'Recommended Action' : 'Inappropriate Action',
      badgeFa: opt.isCorrectAdvice ? 'اقدام توصیه شده' : 'اقدام نامناسب',
    };

    setChatMessages((prev) => [...prev.filter((m) => !m.id.startsWith('rx-decision-')), optMsg]);
  };

  // Generate official GP Referral Letter text
  const generateLetterText = () => {
    const today = new Date().toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const flagsList = scenario.redFlags.map((f) => `  * ${f.en}`).join('\n');
    const medsList = scenario.patientProfile.currentMedications?.map((m) => `  * ${m}`).join('\n') || '  * None reported';
    const medHist = scenario.patientProfile.medicalHistory?.map((h) => `  * ${h}`).join('\n') || '  * None reported';
    const allergies = scenario.patientProfile.allergies?.join(', ') || 'NKDA (No Known Drug Allergies)';

    return `================================================================================
           COMMUNITY PHARMACY CLINICAL REFERRAL NOTE
             (Pharmaceutical Society of Australia Standards)
================================================================================

Date: ${today}

TO: General Practitioner / Medical Officer
RE: Urgent / Non-Urgent Medical Review & Management

PATIENT DETAILS:
  * Full Name: ${scenario.patientProfile.name}
  * Age / Gender: ${scenario.patientProfile.age} years old (${scenario.patientProfile.gender})
  * Allergies: ${allergies}

REASON FOR REFERRAL & PRIMARY PRESENTATION:
  * Presenting Condition: ${scenario.title.en}
  * Patient Presentation:
    "${scenario.patientProfile.presentation.en}"

IDENTIFIED CLINICAL RED FLAGS / CONCERNS:
${flagsList}

CURRENT MEDICATION REGIMEN:
${medsList}

RELEVANT MEDICAL HISTORY:
${medHist}

PHARMACIST'S CLINICAL ASSESSMENT & INTERIM RECOMMENDATIONS:
${scenario.clinicalOutcome.recommendation.en}

GUIDELINE RATIONALE:
${scenario.clinicalOutcome.explanation.en}

--------------------------------------------------------------------------------
REFERRING PHARMACIST:
  * Practitioner Name: ${pharmacistName}
  * AHPRA Registration: ${ahpraRegNumber}
  * Practice Site: ${pharmacyName}
================================================================================`;
  };

  const handleCopyLetter = async () => {
    try {
      await navigator.clipboard.writeText(generateLetterText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrintLetter = () => {
    window.print();
  };

  const wwhamCount = Object.keys(askedQuestions).length;
  const allWwhamAsked = wwhamCount >= 4;
  const selectedOption = scenario.dialogueOptions.find((o) => o.id === selectedDialogueId) || null;
  const browseOpen = isBrowseOpen && !scenarioSearchTerm.trim();

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-12">
      {/* 1. TOP MODULE NAVIGATION: Diseases & Triage Hub vs Simulator Deck */}
      <div className="flex items-center justify-between gap-2 p-1.5 bg-black/5 dark:bg-slate-900/60 rounded-2xl border app-border">
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveView('diseases')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer border ${
              activeView === 'diseases'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm ring-1 ring-emerald-400/30'
                : 'app-bg app-border app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>{isFa ? 'دانشنامه بیماری‌ها و تریاژ' : 'Diseases & Triage Hub'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/20 text-white">
              {DISEASES_REGISTRY.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('simulator')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer border ${
              activeView === 'simulator'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm ring-1 ring-indigo-400/30'
                : 'app-bg app-border app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isFa ? 'شبیه‌ساز تعاملی مکالمه تریاژ' : 'Interactive Triage Deck'}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/20 text-white">
              {OTC_SCENARIOS.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: UNIFIED DISEASES & TRIAGE EXPLORER */}
      {activeView === 'diseases' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Main Category & Subcategory Selector + Triage Only Switch */}
          <UnifiedCategorySelector
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            selectedSubCatId={selectedSubCatId}
            onSelectSubCat={setSelectedSubCatId}
            triageOnly={triageOnlyFilter}
            onToggleTriageOnly={() => setTriageOnlyFilter((prev) => !prev)}
            language={language}
          />

          {/* Disease / Scenario Cards */}
          <UnifiedDiseaseExplorer
            language={language}
            diseases={filteredDiseases}
            specialCategory={activeSpecialCategory}
            searchQuery={diseaseSearchQuery}
            onSearchQueryChange={setDiseaseSearchQuery}
            onSelectDisease={(disease) => setSelectedDisease(disease)}
            onStartTriageForDisease={handleStartTriageForDisease}
            onStartSpecialScenario={handleStartSpecialScenario}
          />
        </div>
      )}

      {/* VIEW 2: INTERACTIVE TRIAGE SIMULATOR DECK */}
      {activeView === 'simulator' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Top Quick Bar: Return to Disease Hub + Linked Monograph affordance */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-black/5 dark:bg-slate-900/60 border app-border">
            <button
              type="button"
              onClick={() => setActiveView('diseases')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isFa ? 'بازگشت به فهرست بیماری‌ها' : 'Back to Disease Catalog'}</span>
            </button>

            {linkedHandbookDisease && (
              <button
                type="button"
                onClick={() => setSelectedDisease(linkedHandbookDisease)}
                className="px-3 py-1.5 rounded-xl bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 border border-teal-500/30 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">
                  {isFa ? `مونوگراف: ${linkedHandbookDisease.name.fa}` : `Guide: ${linkedHandbookDisease.name.en}`}
                </span>
              </button>
            )}
          </div>

          {/* Mode Selector Bar & Scenario Switcher */}
          <div className="space-y-2">
            <ModeSelectorBar
              language={language}
              selectedConversationMode={selectedConversationMode}
              onSelectMode={handleSelectMode}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={handleSelectScenario}
              scenario={scenario}
              filteredScenarios={filteredScenarios}
              scenarioSearchTerm={scenarioSearchTerm}
              setScenarioSearchTerm={setScenarioSearchTerm}
              isAccordionOpen={isAccordionOpen}
              setIsAccordionOpen={setIsAccordionOpen}
              isBrowseOpen={isBrowseOpen}
              setIsBrowseOpen={setIsBrowseOpen}
              modeACount={modeACount}
              modeBCount={modeBCount}
              modeCCount={modeCCount}
            />
            <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="app-muted">
                  {isFa ? `${OTC_SCENARIOS.length} سناریو` : `${OTC_SCENARIOS.length} scenarios`}
                </span>
                <button
                  type="button"
                  onClick={() => setUnreadOnly((value) => !value)}
                  aria-pressed={unreadOnly}
                  className={`px-2 py-1 rounded-lg border font-bold ${
                    unreadOnly ? 'bg-indigo-600 text-white border-indigo-500' : 'app-bg app-muted app-border'
                  }`}
                >
                  {isFa
                    ? `نخوانده (${OTC_SCENARIOS.filter((s) => !isViewed(`otc:${s.id}`)).length})`
                    : `Unread (${OTC_SCENARIOS.filter((s) => !isViewed(`otc:${s.id}`)).length})`}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const colors = [null, 'red', 'yellow', 'green', 'blue'] as const;
                  const current = getItemFlag(scenarioStudyId);
                  const next = colors[(colors.indexOf(current) + 1) % colors.length];
                  setItemFlag(scenarioStudyId, next);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border app-border app-bg hover:app-text transition"
                title={isFa ? 'تغییر فلگ سناریو' : 'Cycle scenario flag'}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{getItemFlag(scenarioStudyId) || (isFa ? 'بدون فلگ' : 'No flag')}</span>
              </button>
            </div>
          </div>

          <ClinicalRelationsPanel
            entityId={`triage:${scenario.id}`}
            language={language}
            onOpenEntity={(entity) => {
              if (!entity || !onNavigateToModule) return;
              const targetModule =
                entity.type === 'triage-scenario'
                  ? 1
                  : entity.type === 'clinical-concept' || entity.type === 'cyp-enzyme' || entity.type === 'mechanism'
                  ? 4
                  : 2;
              const targetContext = entity.type === 'triage-scenario'
                ? `triage:${entity.sourceId}`
                : entity.type === 'product' || entity.type === 'medicine'
                  ? `product:${entity.title.en}`
                  : entity.sourceId;
              onNavigateToModule(targetModule, targetContext);
            }}
            onOpenDisease={(diseaseId) => {
              const disease = DISEASES_REGISTRY.find((item) => item.id === diseaseId);
              if (disease) setSelectedDisease(disease);
            }}
          />

          {browseOpen && (
            <TriageStepDeck
              language={language}
              scenario={scenario}
              linkedHandbookDisease={linkedHandbookDisease}
              onOpenDiseaseModal={setSelectedDisease}
              activeFrameworkTab={activeFrameworkTab}
              setActiveFrameworkTab={setActiveFrameworkTab}
              wwhamCount={wwhamCount}
              askedQuestions={askedQuestions}
              isQnaStarred={isQnaStarred}
              onAskWwhamQuestion={handleAskWwhamQuestion}
              askedRedFlagChecks={askedRedFlagChecks}
              onCheckRedFlags={handleCheckRedFlags}
              allWwhamAsked={allWwhamAsked}
              selectedDialogueId={selectedDialogueId}
              selectedOption={selectedOption}
              onSelectDialogueOption={handleSelectDialogueOption}
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
              onCopySinglePhrase={handleCopySinglePhrase}
              copiedPhraseId={copiedPhraseId}
              onReset={handleReset}
              showOutcome={showOutcome}
              onOpenReferralModal={() => setShowReferralModal(true)}
              onNavigateToFred={onNavigateToFred}
              onNavigateToModule={onNavigateToModule}
              onOpenAiLeitner={onOpenAiLeitner}
            />
          )}
        </div>
      )}

      {/* GP Referral Letter Modal */}
      <ReferralLetterModal
        language={language}
        showReferralModal={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        pharmacistName={pharmacistName}
        setPharmacistName={setPharmacistName}
        ahpraRegNumber={ahpraRegNumber}
        setAhpraRegNumber={setAhpraRegNumber}
        pharmacyName={pharmacyName}
        setPharmacyName={setPharmacyName}
        generateLetterText={generateLetterText}
        onPrintLetter={handlePrintLetter}
        onCopyLetter={handleCopyLetter}
        isCopied={isCopied}
      />

      {/* Starred Phrases Modal */}
      <StarredPhrasesModal
        language={language}
        showStarredModal={showStarredModal}
        onClose={() => setShowStarredModal(false)}
        starredPhrases={starredPhrases}
        starredSearchTerm={starredSearchTerm}
        setStarredSearchTerm={setStarredSearchTerm}
        clearAllStarredPhrases={clearAllStarredPhrases}
        onCopySinglePhrase={handleCopySinglePhrase}
        removeStarredPhrase={removeStarredPhrase}
        copiedPhraseId={copiedPhraseId}
      />

      {/* WWHAM Single Question & Answer Popup Modal */}
      <WwhamQuestionModal
        language={language}
        scenario={scenario}
        activeWwhamQuestion={activeWwhamQuestion}
        onClose={() => setActiveWwhamQuestion(null)}
        isQnaStarred={isQnaStarred}
        onToggleStarQna={toggleStarQna}
      />

      {/* Red Flags Screening Popup Modal */}
      <RedFlagsModal
        language={language}
        scenario={scenario}
        showRedFlagsModal={showRedFlagsModal}
        onClose={() => setShowRedFlagsModal(false)}
        isQnaStarred={isQnaStarred}
        onToggleStarRedFlags={toggleStarRedFlags}
      />

      {/* Disease Detail Pop-up Modal */}
      {selectedDisease && (
        <DiseaseDetailModal
          disease={selectedDisease}
          language={language}
          onClose={() => setSelectedDisease(null)}
          onNavigateToModule={(modNum, scId) => {
            if (modNum === 3 && onNavigateToFred) {
              onNavigateToFred(scId);
            } else if (modNum === 1) {
              // Direct start triage for this disease
              const scenarioId = scId?.replace(/^(triage|otc):/, '');
              const matchingScenarios = OTC_SCENARIOS.filter((s) => s.id === scenarioId);
              if (matchingScenarios[0]) {
                handleStartTriageForDisease(selectedDisease, matchingScenarios[0]);
                setSelectedDisease(null);
              }
            }
          }}
        />
      )}
    </div>
  );
};
