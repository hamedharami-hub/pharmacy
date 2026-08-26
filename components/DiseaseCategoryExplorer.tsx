'use client';

import React, { useState } from 'react';
import { DISEASE_CATEGORIES, DISEASES_REGISTRY, DiseaseInfo } from '@/data/diseasesRegistry';
import { Language } from '@/types/pharmacy';
import { useStudyTrackerContext } from './study/StudyTrackerContext';
import { StudyStatusBadge } from './study/StudyStatusBadge';
import { getOtcClinicalTranslation, translateMedicineAttribute } from '@/data/otcClinicalTranslations';
import { parseDosingToSegments, parseExtraInfoToNotes } from './DiseaseDetailModal';
import { findHandbookGuide, OTCDrugInfo } from '@/src/data/otcHandbookData';
import {
  Search,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Pill,
  ShieldAlert,
  ArrowRight,
  Heart,
  Brain,
  Wind,
  Activity,
  Zap,
  Eye,
  User,
  Clock,
  Tag,
  FileText,
  Baby,
  HeartPulse,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface DiseaseCategoryExplorerProps {
  language: Language;
  onSelectDisease: (disease: DiseaseInfo) => void;
  titleOverride?: string;
  subtitleOverride?: string;
  onNavigateToModule?: (moduleNumber: 1 | 2 | 3 | 4 | 5 | 6, contextId?: string) => void;
  onOpenAiLeitner?: (text: string, module: 1 | 2 | 4, category?: string, topic?: string) => void;
}

export const DiseaseCategoryExplorer: React.FC<DiseaseCategoryExplorerProps> = ({
  language,
  onSelectDisease,
  titleOverride,
  onNavigateToModule,
  onOpenAiLeitner,
}) => {
  const isFa = language === 'fa';
  const { markItemViewed, toggleItemCompleted, isViewed, isCompleted } = useStudyTrackerContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Active focused disease & 3-phase tab state
  const [focusedDisease, setFocusedDisease] = useState<DiseaseInfo | null>(null);
  const [activePhaseTab, setActivePhaseTab] = useState<'profile' | 'treatment' | 'medicines'>('profile');
  const [expandedMedIds, setExpandedMedIds] = useState<{ [key: number]: boolean }>({});

  const toggleMedExpand = (idx: number) => {
    setExpandedMedIds((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Icon mapping helper
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wind':
        return <Wind className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Activity':
        return <Activity className="w-3.5 h-3.5 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'Zap':
        return <Zap className="w-3.5 h-3.5 text-purple-400" />;
      case 'Heart':
        return <Heart className="w-3.5 h-3.5 text-sky-400" />;
      case 'Brain':
        return <Brain className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />;
      case 'Eye':
        return <Eye className="w-3.5 h-3.5 text-cyan-400" />;
      case 'User':
        return <User className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  // Filter diseases based on selected category & search query
  const filteredDiseases = DISEASES_REGISTRY.filter((d) => {
    if (selectedCategory !== 'ALL' && d.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const faName = d.name.fa.toLowerCase();
      const enName = d.name.en.toLowerCase();
      const overviewFa = d.overview.fa.toLowerCase();
      const overviewEn = d.overview.en.toLowerCase();
      const syns = d.synonyms.join(' ').toLowerCase();

      return (
        faName.includes(q) ||
        enName.includes(q) ||
        overviewFa.includes(q) ||
        overviewEn.includes(q) ||
        syns.includes(q)
      );
    }
    return true;
  });

  // If a disease is focused for inline study:
  const renderFocusedDiseaseHub = () => {
    if (!focusedDisease) return null;

    const category =
      DISEASE_CATEGORIES.find((c) => c.id === focusedDisease.categoryId) || DISEASE_CATEGORIES[0];
    const viewed = isViewed(focusedDisease.id);
    const completed = isCompleted(focusedDisease.id);

    const clinicalTranslation = getOtcClinicalTranslation(focusedDisease.id);
    const fallbackGuide = findHandbookGuide(focusedDisease);
    const medicines: OTCDrugInfo[] = focusedDisease.medicines || fallbackGuide?.medicines || [];

    const diseaseTitle = isFa
      ? clinicalTranslation?.cleanFaName || focusedDisease.name.fa || focusedDisease.name.en
      : clinicalTranslation?.cleanEnName || focusedDisease.name.en;

    const primaryCommonName = isFa
      ? clinicalTranslation?.primaryCommonNameFa || focusedDisease.synonyms?.[0] || focusedDisease.name.fa
      : clinicalTranslation?.primaryCommonNameEn || focusedDisease.synonyms?.[0] || focusedDisease.name.en;

    const primaryBrand = clinicalTranslation?.primaryBrand || (medicines[0]?.brandExamples || focusedDisease.synonyms?.[1] || 'Standard OTC');

    const firstLineData = clinicalTranslation?.firstLine;
    let rawDrug = isFa
      ? firstLineData?.drugNameFa || focusedDisease.treatment?.firstLine?.fa || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].name : '')
      : firstLineData?.drugNameEn || focusedDisease.treatment?.firstLine?.en || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].name : '');

    let rawDosing = isFa
      ? firstLineData?.dosingFa || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].dosing : focusedDisease.instructions?.fa)
      : firstLineData?.dosingEn || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].dosing : focusedDisease.instructions?.en);

    if (rawDrug.includes('— نحوه مصرف') || rawDrug.includes('— Dosing:')) {
      const parts = rawDrug.split(/—\s*(?:نحوه مصرف(?: و دوزینگ)?|Dosing):\s*/i);
      if (parts[0]) rawDrug = parts[0].replace(/^خط اول درمان:\s*/i, '').trim();
      if (parts[1] && (!firstLineData?.dosingFa || rawDosing === focusedDisease.instructions?.fa)) {
        rawDosing = parts[1].trim();
      }
    } else {
      rawDrug = rawDrug.replace(/^خط اول درمان:\s*/i, '').trim();
    }

    const firstLineDrug = rawDrug || (isFa ? 'درمان دارویی استاندارد' : 'Standard Pharmacotherapy');
    const firstLineClass = isFa
      ? firstLineData?.drugClassFa || 'داروی استاندارد خط اول'
      : firstLineData?.drugClassEn || 'Standard First-Line Pharmacotherapy';

    const firstLineDosingSegments = parseDosingToSegments(rawDosing, isFa);

    // Symptoms
    let resolvedSymptoms: string[] = [];
    if (isFa && clinicalTranslation?.symptomsFa && clinicalTranslation.symptomsFa.length > 0) {
      resolvedSymptoms = clinicalTranslation.symptomsFa;
    } else if (focusedDisease.symptoms && focusedDisease.symptoms.length > 0) {
      resolvedSymptoms = focusedDisease.symptoms.flatMap((s) => s.split(/[,،;•]/).map((t) => t.trim()).filter(Boolean));
    } else if (fallbackGuide?.symptoms && fallbackGuide.symptoms.length > 0) {
      resolvedSymptoms = fallbackGuide.symptoms.flatMap((s: string) => s.split(/[,،;•]/).map((t: string) => t.trim()).filter(Boolean));
    }

    // Red Flags
    const redFlagsList = isFa
      ? clinicalTranslation?.redFlagsFa || focusedDisease.redFlags?.fa || fallbackGuide?.referralCriteria || []
      : focusedDisease.redFlags?.en || fallbackGuide?.referralCriteria || clinicalTranslation?.redFlagsFa || [];

    // Clinical Pearls
    let resolvedClinicalNotes: string[] = [];
    if (isFa && clinicalTranslation?.clinicalPearlsFa && clinicalTranslation.clinicalPearlsFa.length > 0) {
      resolvedClinicalNotes = clinicalTranslation.clinicalPearlsFa;
    } else if (focusedDisease.clinicalNotes && focusedDisease.clinicalNotes.length > 0) {
      resolvedClinicalNotes = focusedDisease.clinicalNotes;
    } else if (fallbackGuide?.clinicalNotes && fallbackGuide.clinicalNotes.length > 0) {
      resolvedClinicalNotes = fallbackGuide.clinicalNotes;
    }

    const rawOverview = focusedDisease.overview?.[language] || focusedDisease.overview?.en || '';
    const cleanedOverview = rawOverview
      .replace(/[\.\s]*علائم تشخیصی کلیدی:.*$/i, '')
      .replace(/[\.\s]*Key presentations:.*$/i, '')
      .trim();

    return (
      <div
        data-module="2"
        data-category={category.name.en}
        data-topic={focusedDisease.name.en}
        className="space-y-4 animate-fadeIn select-text"
      >
        {/* Top Header Card */}
        <div className="app-card border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-lg bg-linear-to-r from-emerald-950/25 via-slate-900/40 to-transparent flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {category.name[language] || category.name.en}
                </span>
                <span className="text-xs app-muted font-mono bg-slate-800/80 px-2 py-0.5 rounded-md">
                  {focusedDisease.id}
                </span>
                <StudyStatusBadge
                  language={language}
                  viewed={viewed}
                  completed={completed}
                  size="sm"
                  onToggleComplete={(e) => {
                    e.stopPropagation();
                    toggleItemCompleted(
                      4,
                      focusedDisease.id,
                      { fa: focusedDisease.name.fa || focusedDisease.name.en, en: focusedDisease.name.en || focusedDisease.name.fa },
                      { fa: category.name.fa || category.name.en, en: category.name.en || category.name.fa }
                    );
                  }}
                />
              </div>
              <h2 className="text-base sm:text-lg font-black app-text truncate pt-1">
                {diseaseTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFocusedDisease(null)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>{isFa ? 'تغییر بیماری و بازگشت به لیست' : 'Change Condition'}</span>
          </button>
        </div>

        {/* 3-PHASE TABS */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border app-border text-xs">
          <button
            type="button"
            onClick={() => setActivePhaseTab('profile')}
            className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePhaseTab === 'profile'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span className="truncate">{isFa ? '۱. علائم و خط قرمزها' : '1. Signs & Red Flags'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePhaseTab('treatment')}
            className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePhaseTab === 'treatment'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span className="truncate">{isFa ? '۲. پروتکل درمان و دوزاژ' : '2. Treatment & Dosing'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePhaseTab('medicines')}
            className={`py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePhaseTab === 'medicines'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate">
              {isFa ? `۳. داروهای قفسه (${medicines.length})` : `3. Medicines (${medicines.length})`}
            </span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* PHASE 1: SIGNS, SYMPTOMS & RED FLAGS                         */}
        {/* ============================================================ */}
        {activePhaseTab === 'profile' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* Common Name & Brand Pill */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">{isFa ? 'نام رایج:' : 'Common Name:'}</span>
                <span className="text-sky-300 font-bold">{primaryCommonName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">{isFa ? 'برند اصلی:' : 'Primary Brand:'}</span>
                <span className="text-amber-400 font-bold">{primaryBrand}</span>
              </div>
            </div>

            {/* Overview */}
            {cleanedOverview && (
              <div className="p-4 rounded-2xl app-card border border-sky-500/30 bg-sky-500/5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-400">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>{isFa ? 'تعریف و پاتوفیزیولوژی بالینی:' : 'Clinical Definition & Overview:'}</span>
                </div>
                <p className="app-text text-xs sm:text-sm leading-relaxed">{cleanedOverview}</p>
              </div>
            )}

            {/* Symptoms Grid */}
            {resolvedSymptoms.length > 0 && (
              <div className="p-4 rounded-2xl app-card border app-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-400">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <span>{isFa ? 'علائم بالینی شایع:' : 'Common Clinical Presentations:'}</span>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 font-bold">{resolvedSymptoms.length} {isFa ? 'مورد' : 'symptoms'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {resolvedSymptoms.map((sym, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-200 text-xs font-bold flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                      <span className="truncate">{sym}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags */}
            {redFlagsList.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-500/35 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/25 pb-2">
                  <div className="flex items-center gap-2 text-rose-400 font-black text-xs sm:text-sm">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{isFa ? '🚨 علائم خط قرمز و معیارهای ارجاع فوری (Red Flags):' : '🚨 Urgent Referral Criteria (Red Flags):'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                    {redFlagsList.length} {isFa ? 'هشدار' : 'flags'}
                  </span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-rose-200 font-medium">
                  {redFlagsList.map((ref, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/25">
                      <span className="text-rose-400 font-bold shrink-0 mt-0.5">🚩</span>
                      <span className="leading-relaxed">{ref}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clinical Pearls */}
            {resolvedClinicalNotes.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? '💡 مرواریدها و نکات تشخیصی داروساز (Clinical Pearls):' : '💡 Clinical Pearls:'}</span>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-amber-100 font-medium">
                  {resolvedClinicalNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-500 font-bold shrink-0 mt-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Phase Button */}
            <button
              type="button"
              onClick={() => setActivePhaseTab('treatment')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
            >
              <span>{isFa ? 'مشاهده پروتکل خط اول درمان و دوزاژ سنی ➜' : 'View Treatment Protocol & Dosing ➜'}</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 2: TREATMENT PROTOCOL & DOSING                         */}
        {/* ============================================================ */}
        {activePhaseTab === 'treatment' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* First-Line Pharmacotherapy Card */}
            <div className="p-4 sm:p-5 rounded-2xl app-card border border-emerald-500/35 space-y-3.5 shadow-md bg-emerald-500/5 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                <h3 className="font-black text-xs sm:text-sm text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isFa ? 'پروتکل خط اول درمان (APF & PSA First-Line):' : 'First-Line Pharmacotherapy:'}</span>
                </h3>
                <span className="text-[10px] font-mono font-bold text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  APF First-Line
                </span>
              </div>

              <div className="p-3.5 rounded-xl app-card border border-emerald-500/25 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b app-border pb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30 flex items-center justify-center font-mono shrink-0">
                        1
                      </span>
                      <span className="text-sm sm:text-base font-black text-emerald-200">
                        {firstLineDrug}
                      </span>
                    </div>
                    <div className="text-xs text-sky-300 font-medium flex items-center gap-1.5 pt-0.5">
                      <Tag className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{isFa ? 'طبقه‌بندی دارویی:' : 'Class:'} {firstLineClass}</span>
                    </div>
                  </div>
                </div>

                {/* Dosing Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs sm:text-sm">
                    <Clock className="w-4 h-4 shrink-0 text-sky-400" />
                    <span>{isFa ? 'دوزبندی و نحوه مصرف استرالیا (تفکیک رده‌های سنی):' : 'Australian Dosage & Administration by Age Group:'}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {firstLineDosingSegments.map((seg, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2.5 sm:p-3 rounded-xl app-bg border app-border flex items-start gap-2.5 text-xs sm:text-sm"
                      >
                        <span className="text-base sm:text-lg leading-none shrink-0 mt-0.5">{seg.icon}</span>
                        <div className="space-y-0.5 flex-1">
                          <span className="font-bold text-sky-300 text-[11px] block">
                            {isFa ? seg.labelFa : seg.labelEn}:
                          </span>
                          <p className="text-xs sm:text-sm app-text font-medium leading-relaxed">
                            {seg.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Next/Back Navigation */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActivePhaseTab('profile')}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <span>{isFa ? '← بازگشت به علائم' : '← Back to Signs'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePhaseTab('medicines')}
                className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>{isFa ? `مشاهده داروهای قفسه (${medicines.length}) ➜` : `View Medicines (${medicines.length}) ➜`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 3: APPROVED OTC MEDICINES & SHELF LINKING              */}
        {/* ============================================================ */}
        {activePhaseTab === 'medicines' && (
          <div className="space-y-3.5 animate-fadeIn">
            {medicines.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm app-text flex items-center gap-1.5 text-indigo-300">
                    <Pill className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{isFa ? 'داروهای بدون نسخه، برندهای استرالیایی و دوزینگ:' : 'Approved OTC Medicines, Brands & Dosing:'}</span>
                  </h4>
                  <span className="text-xs app-muted font-mono">{medicines.length} {isFa ? 'دارو' : 'options'}</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {medicines.map((med: OTCDrugInfo, idx: number) => {
                    const isExpanded = !!expandedMedIds[idx];
                    const medDosingSegments = parseDosingToSegments(med.dosing, isFa);
                    const medNotes = parseExtraInfoToNotes(med.extraInfo);

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                          isExpanded
                            ? 'app-card border-indigo-500/60 ring-2 ring-indigo-500/20'
                            : 'app-card border-slate-800 hover:border-indigo-400/50'
                        }`}
                      >
                        {/* Accordion Header */}
                        <div
                          onClick={() => toggleMedExpand(idx)}
                          className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-300 font-bold text-xs border border-indigo-500/30 flex items-center justify-center font-mono shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-black text-xs sm:text-sm text-sky-400 truncate">
                                {med.name}
                              </div>
                              {!isExpanded && (
                                <div className="text-[11px] app-muted truncate mt-0.5 flex items-center gap-1.5">
                                  <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="text-amber-200 truncate font-semibold">{med.brandExamples}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden sm:inline-block">
                              {isExpanded ? (isFa ? 'بستن' : 'Close') : (isFa ? 'مشاهده مشخصات' : 'View Details')}
                            </span>
                            <div className={`p-1.5 rounded-lg border transition ${isExpanded ? 'bg-indigo-600 text-white border-indigo-500' : 'app-bg app-muted border-slate-700'}`}>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="p-3 sm:p-4 pt-2 border-t app-border space-y-3 bg-black/5 dark:bg-slate-950/40 animate-fadeIn">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b app-border pb-2.5">
                              <div className="text-xs sm:text-sm text-amber-300 font-medium flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>
                                  {isFa ? 'برندهای رایج استرالیا:' : 'Australian Brands:'}{' '}
                                  <span className="font-black text-amber-200">{med.brandExamples}</span>
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1 font-bold">
                                  <Baby className="w-3.5 h-3.5 text-sky-400" />
                                  <span>
                                    {isFa ? translateMedicineAttribute(med.minAge, 'minAge') : med.minAge}
                                  </span>
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-bold">
                                  <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
                                  <span>
                                    {isFa ? translateMedicineAttribute(med.pregnancySafety, 'pregnancy') : med.pregnancySafety}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Dosing Breakdown */}
                            <div className="p-2.5 sm:p-3 rounded-xl app-card border app-border space-y-2">
                              <div className="flex items-center gap-1 text-emerald-400 text-xs sm:text-sm font-bold">
                                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{isFa ? 'دوزبندی تفکیک‌شده و نحوه مصرف استرالیا:' : 'Australian Dosage Breakdown:'}</span>
                              </div>

                              <div className="grid grid-cols-1 gap-1.5">
                                {medDosingSegments.map((seg, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2 rounded-lg app-bg border app-border flex items-start gap-2 text-xs sm:text-sm"
                                  >
                                    <span className="text-base leading-none shrink-0 mt-0.5">{seg.icon}</span>
                                    <div className="space-y-0.5 flex-1">
                                      <span className="font-bold text-emerald-300 text-[11px] block">
                                        {isFa ? seg.labelFa : seg.labelEn}:
                                      </span>
                                      <p className="text-xs sm:text-sm app-text font-medium leading-relaxed">
                                        {isFa ? translateMedicineAttribute(seg.text, 'dosing') : seg.text}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl app-card border app-border text-center app-muted text-xs space-y-2">
                <Pill className="w-8 h-8 mx-auto text-slate-600" />
                <p>{isFa ? 'داروی بدون نسخه اختصاصی در مونوگراف ثبت نشده است.' : 'No OTC medicines registered.'}</p>
              </div>
            )}

            {/* Jump to Module 2 Shelf */}
            <div className="pt-2 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePhaseTab('treatment')}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <span>{isFa ? '← بازگشت به پروتکل درمان' : '← Back to Protocol'}</span>
              </button>

              {onNavigateToModule && (
                <button
                  onClick={() => onNavigateToModule(2)}
                  className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>{isFa ? 'مشاهده در قفسه محصولات (ماژول ۲)' : 'View in Shelf (Module 2)'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-3xl border app-border app-card p-4 sm:p-5 shadow-lg space-y-4 animate-fadeIn">
      {/* If a disease is active, show its modern 3-phase study hub */}
      {focusedDisease ? (
        renderFocusedDiseaseHub()
      ) : (
        /* Otherwise show the clean category selector and disease list */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b app-border pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/25 shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black app-text">
                  {titleOverride || (isFa ? 'فهرست و راهنمای درمان بالینی بیماری‌ها' : 'Clinical Diseases & Treatment Guide')}
                </h3>
                <p className="text-xs app-muted">
                  {isFa
                    ? 'بیماری مورد نظر را انتخاب کنید تا مشخصات، خط قرمزها و پروتکل‌های درمانی ۳ فازی نمایش یابد.'
                    : 'Select a disease to view 3-phase clinical presentations, red flags, and treatment protocols.'}
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Search and Categories */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 rtl:right-3 rtl:left-auto left-3 rtl:left-auto top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? 'جستجوی نام بیماری (مثلاً آسم، ریفلاکس، اگزما، میگرن)...'
                    : 'Search condition (e.g., Asthma, GERD, Eczema, Migraine)...'
                }
                className="w-full pr-9 pl-3 rtl:pr-9 rtl:pl-3 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/60 text-xs app-text placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {isFa ? 'همه دسته‌ها' : 'All'}
              </button>

              {DISEASE_CATEGORIES.map((cat) => {
                const isSel = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {renderCategoryIcon(cat.iconName)}
                    <span>{cat.name[language] || cat.name.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Diseases Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {filteredDiseases.length > 0 ? (
              filteredDiseases.map((d) => {
                const cat = DISEASE_CATEGORIES.find((c) => c.id === d.categoryId) || DISEASE_CATEGORIES[0];
                const viewed = isViewed(d.id);
                const completed = isCompleted(d.id);

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      markItemViewed(
                        4,
                        d.id,
                        { fa: d.name.fa || d.name.en, en: d.name.en || d.name.fa },
                        { fa: cat.name.fa || cat.name.en, en: cat.name.en || cat.name.fa },
                        { tabId: 'diseases', categoryId: d.categoryId }
                      );
                      setFocusedDisease(d);
                      onSelectDisease(d);
                    }}
                    className={`group p-3.5 rounded-2xl bg-slate-950/40 hover:bg-slate-800/70 border transition cursor-pointer flex flex-col justify-between space-y-2.5 relative overflow-hidden shadow-sm hover:scale-[1.01] ${
                      completed ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'app-border hover:border-indigo-500/50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="font-mono text-indigo-400 font-bold truncate">
                          {cat.name[language] || cat.name.en}
                        </span>
                        <StudyStatusBadge
                          language={language}
                          viewed={viewed}
                          completed={completed}
                          size="sm"
                          onToggleComplete={(e) => {
                            e.stopPropagation();
                            toggleItemCompleted(
                              4,
                              d.id,
                              { fa: d.name.fa || d.name.en, en: d.name.en || d.name.fa },
                              { fa: cat.name.fa || cat.name.en, en: cat.name.en || cat.name.fa }
                            );
                          }}
                        />
                      </div>

                      <div className="font-black text-xs sm:text-sm app-text group-hover:text-indigo-400 transition line-clamp-1">
                        {d.name[language] || d.name.en}
                      </div>

                      <p className="text-[11px] app-muted line-clamp-2 leading-relaxed">
                        {d.overview[language] || d.overview.en}
                      </p>
                    </div>

                    <div className="pt-2 border-t app-border flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isFa ? 'مطالعه ۳ فازی بیماری' : 'Study Condition'}</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-8 text-center text-xs app-muted bg-slate-950/20 rounded-2xl border app-border">
                {isFa ? 'هیچ بیماری مطابق با عبارت جستجو یافت نشد.' : 'No matching diseases found.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
