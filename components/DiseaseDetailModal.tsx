'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DiseaseInfo, DISEASE_CATEGORIES } from '@/data/diseasesRegistry';
import { Language } from '@/types/pharmacy';
import { findHandbookGuide, OTCDrugInfo } from '@/src/data/otcHandbookData';
import { getOtcClinicalTranslation, translateMedicineAttribute, translateClinicalText } from '@/data/otcClinicalTranslations';
import { useStudyTrackerContext } from './study/StudyTrackerContext';
import { StudyStatusBadge } from './study/StudyStatusBadge';
import {
  X,
  Stethoscope,
  Activity,
  Pill,
  ShieldAlert,
  Sparkles,
  Info,
  Baby,
  HeartPulse,
  Clock,
  ArrowRight,
  BookmarkCheck,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  UserCheck,
  AlertCircle,
  Check,
  FileText,
} from 'lucide-react';

interface DiseaseDetailModalProps {
  disease: DiseaseInfo | null;
  language: Language;
  onClose: () => void;
  onNavigateToModule?: (moduleNumber: 1 | 2 | 3, scenarioId?: string) => void;
}

export interface ParsedDosingSegment {
  type: 'adult' | 'child' | 'infant' | 'max' | 'schedule' | 'note';
  icon: string;
  labelEn: string;
  labelFa: string;
  text: string;
}

/**
 * Intelligent parser that splits continuous dosing text into separated, population-specific lines.
 */
export function parseDosingToSegments(rawDosing: string, isFa: boolean): ParsedDosingSegment[] {
  if (!rawDosing) return [];

  const clean = rawDosing.trim();
  const segments: ParsedDosingSegment[] = [];

  // Pattern 1: Check for explicit Adult / Child / Infant markers
  const hasAdult = /adults?|بزرگسال/i.test(clean);
  const hasChild = /child(ren)?|paediatric|پدیاتریک|کودک/i.test(clean);
  const hasInfant = /infants?|نوزاد/i.test(clean);

  if (hasAdult || hasChild || hasInfant) {
    const adultMatch = clean.match(/(?:Adults?(?:\s*(?:>|over)\s*\d+\s*(?:yo|y|years))?|بزرگسالان?)\s*[:—\-]?\s*([^.]+(?:\([^)]+\))?[^.]*?)(?=(?:Child(?:ren)?|Infants?|کودکان?|نوزادان?)|$)/i);
    const childMatch = clean.match(/(?:Child(?:ren)?(?:\s*(?:>|under|\d+-\d+)?\s*(?:yo|y|years|m|months))?|کودکان?|پدیاتریک)\s*[:—\-]?\s*([^.]+(?:\([^)]+\))?[^.]*?)(?=(?:Infants?|Adults?|نوزادان?)|$)/i);
    const infantMatch = clean.match(/(?:Infants?(?:\s*\d+-\d+\s*m)?|نوزادان?)\s*[:—\-]?\s*([^.]+(?:\([^)]+\))?[^.]*?)(?=(?:Adults?|Child(?:ren)?)|$)/i);

    if (adultMatch && adultMatch[1]?.trim()) {
      segments.push({
        type: 'adult',
        icon: '👨',
        labelEn: 'Adults (>12 yrs)',
        labelFa: 'بزرگسالان و بالای ۱۲ سال',
        text: adultMatch[1].trim().replace(/^[;,\s]+|[;,\s]+$/g, ''),
      });
    }
    if (childMatch && childMatch[1]?.trim()) {
      segments.push({
        type: 'child',
        icon: '🧒',
        labelEn: 'Children / Paediatric',
        labelFa: 'کودکان و اطفال',
        text: childMatch[1].trim().replace(/^[;,\s]+|[;,\s]+$/g, ''),
      });
    }
    if (infantMatch && infantMatch[1]?.trim()) {
      segments.push({
        type: 'infant',
        icon: '👶',
        labelEn: 'Infants & Neonates',
        labelFa: 'نوزادان و خردسالان',
        text: infantMatch[1].trim().replace(/^[;,\s]+|[;,\s]+$/g, ''),
      });
    }

    if (segments.length > 0) {
      return segments;
    }
  }

  // Pattern 2: Numbered steps like "1) ... 2) ..." or "۱) ... ۲) ..."
  if (/(?:[1-9]\)|\([1-9]\)|[۱-۹]\)|\([۱-۹]\))/.test(clean)) {
    const parts = clean.split(/(?:[1-9]\)|\([1-9]\)|[۱-۹]\)|\([۱-۹]\))/g).map(p => p.trim()).filter(Boolean);
    parts.forEach((p, idx) => {
      segments.push({
        type: 'schedule',
        icon: idx === 0 ? '①' : idx === 1 ? '②' : idx === 2 ? '③' : '④',
        labelEn: `${idx + 1}`,
        labelFa: `${idx + 1}`,
        text: p,
      });
    });
    return segments;
  }

  // Pattern 3: Multi-sentence or semicolon-separated clauses
  const sentences = clean.split(/(?<=[.؛;])\s+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length > 1) {
    sentences.forEach((s, idx) => {
      const isWarning = /caution|warning|contraindicated|avoid|ممنوع|هشدار|پرهیز/i.test(s);
      const isMax = /max|maximum|حداکثر/i.test(s);
      segments.push({
        type: isWarning ? 'note' : isMax ? 'max' : 'schedule',
        icon: isWarning ? '⚠️' : isMax ? '🛑' : '⏱️',
        labelEn: isWarning ? 'Precaution' : isMax ? 'Max Daily Limit' : `${idx + 1}`,
        labelFa: isWarning ? 'احتیاط و منع مصرف' : isMax ? 'سقف مجاز روزانه' : `${idx + 1}`,
        text: s,
      });
    });
    return segments;
  }

  // Default single item
  return [
    {
      type: 'schedule',
      icon: '⏱️',
      labelEn: 'Administration & Dosage',
      labelFa: 'دوز و شیوه مصرف استاندارد',
      text: clean,
    },
  ];
}

/**
 * Splits extra clinical pearls into distinct bullet lines
 */
export function parseExtraInfoToNotes(rawInfo?: string): string[] {
  if (!rawInfo) return [];
  return rawInfo
    .split(/(?<=[.!؟?])\s+|\s*[;؛—]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/**
 * Splits general text into bullet items
 */
export function parseTextToBulletList(rawText?: string): string[] {
  if (!rawText) return [];
  if (/(?:[1-9]\)|\([1-9]\)|[۱-۹]\)|\([۱-۹]\))/.test(rawText)) {
    return rawText
      .split(/(?:[1-9]\)|\([1-9]\)|[۱-۹]\)|\([۱-۹]\))/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
  }
  return rawText
    .split(/(?<=[.؛!؟?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

export const DiseaseDetailModal: React.FC<DiseaseDetailModalProps> = ({
  disease,
  language,
  onClose,
  onNavigateToModule,
}) => {
  const isFa = language === 'fa';
  const [mounted, setMounted] = useState<boolean>(false);
  const [showBrandsPopup, setShowBrandsPopup] = useState<boolean>(false);
  const [expandedMedIds, setExpandedMedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showBrandsPopup) {
          setShowBrandsPopup(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBrandsPopup, onClose]);

  const { markItemViewed, toggleItemCompleted, isViewed, isCompleted } = useStudyTrackerContext();

  const toggleMedExpand = (idx: number) => {
    setExpandedMedIds((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!disease) return null;

  const category =
    DISEASE_CATEGORIES.find((c) => c.id === disease.categoryId) || DISEASE_CATEGORIES[0];

  const viewed = isViewed(disease.id);
  const completed = isCompleted(disease.id);

  // Resolve rich clinical translation
  const clinicalTranslation = getOtcClinicalTranslation(disease.id);

  // Resolve medicines & monograph data (from disease object or fallback helper)
  const fallbackGuide = findHandbookGuide(disease);
  const medicines: OTCDrugInfo[] = disease.medicines || fallbackGuide?.medicines || [];

  // Primary display names
  const diseaseTitle = isFa
    ? (clinicalTranslation?.cleanFaName || disease.name.fa || disease.name.en)
    : (clinicalTranslation?.cleanEnName || disease.name.en);

  // Primary Common Name & Brand
  const primaryCommonName = isFa
    ? (clinicalTranslation?.primaryCommonNameFa || disease.synonyms?.[0] || disease.name.fa)
    : (clinicalTranslation?.primaryCommonNameEn || disease.synonyms?.[0] || disease.name.en);

  const primaryBrand = clinicalTranslation?.primaryBrand || (medicines[0]?.brandExamples || disease.synonyms?.[1] || 'Standard OTC');

  // Full Brand List & Synonyms for Popup
  const australianBrands = clinicalTranslation?.australianBrands || medicines.map(m => ({
    brand: m.brandExamples,
    generic: m.name,
    form: m.dosing || 'Standard formulation',
  }));

  const allSynonyms = isFa
    ? (clinicalTranslation?.commonSynonymsFa || disease.synonyms || [])
    : (clinicalTranslation?.commonSynonymsEn || disease.synonyms || []);

  const totalExtraBrands = Math.max(0, (australianBrands.length > 1 ? australianBrands.length - 1 : 0) + (allSynonyms.length > 1 ? allSynonyms.length - 1 : 0));

  // First-Line structured data extraction & cleansing
  const firstLineData = clinicalTranslation?.firstLine;
  
  let rawDrug = isFa
    ? (firstLineData?.drugNameFa || disease.treatment?.firstLine?.fa || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].name : ''))
    : (firstLineData?.drugNameEn || disease.treatment?.firstLine?.en || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].name : ''));

  let rawDosing = isFa
    ? (firstLineData?.dosingFa || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].dosing : disease.instructions?.fa))
    : (firstLineData?.dosingEn || (fallbackGuide?.medicines?.[0] ? fallbackGuide.medicines[0].dosing : disease.instructions?.en));

  // Clean rawDrug if it contains concatenated dosing or prefixes
  if (rawDrug.includes('— نحوه مصرف') || rawDrug.includes('— Dosing:')) {
    const parts = rawDrug.split(/—\s*(?:نحوه مصرف(?: و دوزینگ)?|Dosing):\s*/i);
    if (parts[0]) rawDrug = parts[0].replace(/^خط اول درمان:\s*/i, '').trim();
    if (parts[1] && (!firstLineData?.dosingFa || rawDosing === disease.instructions?.fa)) {
      rawDosing = parts[1].trim();
    }
  } else {
    rawDrug = rawDrug.replace(/^خط اول درمان:\s*/i, '').trim();
  }

  const firstLineDrug = rawDrug || (isFa ? 'درمان دارویی استاندارد' : 'Standard Pharmacotherapy');

  const firstLineClass = isFa
    ? (firstLineData?.drugClassFa || 'داروی استاندارد خط اول (First-Line Pharmacotherapy)')
    : (firstLineData?.drugClassEn || 'Standard First-Line Pharmacotherapy');

  const firstLineDosingSegments = parseDosingToSegments(rawDosing, isFa);

  const firstLineOnset = isFa
    ? (firstLineData?.onsetCourseFa || 'تسکین علامتی سریع مطابق با دوزبندی استاندارد.')
    : (firstLineData?.onsetCourseEn || 'Rapid symptomatic relief following standard dosage schedule.');
  const onsetBullets = parseTextToBulletList(firstLineOnset);

  const firstLineWarnings = isFa
    ? (firstLineData?.keyWarningsFa || 'قبل از مصرف به منع مصرف‌ها، تداخلات و شرایط بیمار توجه شود.')
    : (firstLineData?.keyWarningsEn || 'Check contraindications, drug interactions, and special patient populations prior to supply.');
  const warningsBullets = parseTextToBulletList(firstLineWarnings);

  // Red Flags
  const redFlagsList: string[] = isFa
    ? (clinicalTranslation?.redFlagsFa || disease.redFlags?.fa || fallbackGuide?.referralCriteria || [])
    : (disease.redFlags?.en || fallbackGuide?.referralCriteria || clinicalTranslation?.redFlagsFa || []);

  // Overview, Symptoms & Diagnostic Notes extraction
  const rawOverview = disease.overview?.[language] || disease.overview?.en || '';
  const cleanedOverview = rawOverview
    .replace(/[\.\s]*علائم تشخیصی کلیدی:.*$/i, '')
    .replace(/[\.\s]*Key presentations:.*$/i, '')
    .trim();

  // Symptoms extraction
  let resolvedSymptoms: string[] = [];
  if (isFa && clinicalTranslation?.symptomsFa && clinicalTranslation.symptomsFa.length > 0) {
    resolvedSymptoms = clinicalTranslation.symptomsFa;
  } else if (disease.symptoms && disease.symptoms.length > 0) {
    resolvedSymptoms = disease.symptoms.flatMap((s) => s.split(/[,،;•]/).map((t) => t.trim()).filter(Boolean));
  } else if (fallbackGuide?.symptoms && fallbackGuide.symptoms.length > 0) {
    resolvedSymptoms = fallbackGuide.symptoms.flatMap((s: string) => s.split(/[,،;•]/).map((t: string) => t.trim()).filter(Boolean));
  } else if (disease.pathophysiology) {
    const rawPatho = disease.pathophysiology[language] || disease.pathophysiology.en || '';
    if (rawPatho.includes('علائم بالینی:') || rawPatho.includes('Clinical Symptoms:')) {
      const match = rawPatho.match(/(?:علائم بالینی:|Clinical Symptoms:)\s*([^.\n]+)/i);
      if (match && match[1]) {
        resolvedSymptoms = match[1].split(/[,،;•-]/).map((t) => t.trim()).filter(Boolean);
      }
    }
  }

  // Clinical & Diagnostic Notes extraction
  let resolvedClinicalNotes: string[] = [];
  if (isFa && clinicalTranslation?.clinicalPearlsFa && clinicalTranslation.clinicalPearlsFa.length > 0) {
    resolvedClinicalNotes = clinicalTranslation.clinicalPearlsFa;
  } else if (disease.clinicalNotes && disease.clinicalNotes.length > 0) {
    resolvedClinicalNotes = disease.clinicalNotes;
  } else if (fallbackGuide?.clinicalNotes && fallbackGuide.clinicalNotes.length > 0) {
    resolvedClinicalNotes = fallbackGuide.clinicalNotes;
  } else if (disease.pathophysiology) {
    const rawPatho = disease.pathophysiology[language] || disease.pathophysiology.en || '';
    if (rawPatho.includes('نکات عملکردی و تشخیصی:') || rawPatho.includes('Practice Pearls:')) {
      const match = rawPatho.match(/(?:نکات عملکردی و تشخیصی:|Practice Pearls:)\s*([\s\S]+)$/i);
      if (match && match[1]) {
        resolvedClinicalNotes = match[1].split(/(?<=[.!?])\s+/).map((t) => t.trim()).filter(Boolean);
      }
    }
  }

  // Pharmacist Counseling & Non-pharm advice
  let pharmacistInstructions = '';
  if (isFa) {
    if (clinicalTranslation?.nonPharmFa && clinicalTranslation.nonPharmFa.length > 0) {
      pharmacistInstructions = clinicalTranslation.nonPharmFa.map((a, i) => `${i + 1}) ${a}`).join('\n');
    } else if (disease.instructions?.fa && !/^[a-zA-Z0-9\s.,!?:;()\-]+$/.test(disease.instructions.fa.trim())) {
      pharmacistInstructions = disease.instructions.fa;
    } else if (disease.nonPharmAdvice && disease.nonPharmAdvice.length > 0) {
      pharmacistInstructions = disease.nonPharmAdvice.map((a, i) => `${i + 1}) ${translateClinicalText(a)}`).join('\n');
    } else {
      const rawIns = disease.instructions?.fa || disease.instructions?.en || '';
      pharmacistInstructions = rawIns
        .split('\n')
        .map((line) => {
          const numMatch = line.match(/^([0-9]+\))\s*(.*)$/);
          if (numMatch) {
            return `${numMatch[1]} ${translateClinicalText(numMatch[2])}`;
          }
          return translateClinicalText(line);
        })
        .join('\n');
    }
  } else {
    pharmacistInstructions = disease.instructions?.en || disease.instructions?.fa || '';
  }

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={diseaseTitle}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full h-[100dvh] sm:h-[94vh] sm:max-h-[880px] max-w-5xl lg:max-w-6xl xl:max-w-7xl rounded-none sm:rounded-3xl app-card border-0 sm:border app-border shadow-2xl app-text overflow-hidden flex flex-col bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED TOP HEADER */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b app-border bg-slate-950/95 backdrop-blur-md shrink-0 z-20 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {category.name[language] || category.name.en}
                </span>
                <span className="text-[10px] sm:text-[11px] app-muted font-mono bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                  {disease.id}
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
                      disease.id,
                      { fa: disease.name.fa || disease.name.en, en: disease.name.en || disease.name.fa },
                      { fa: category.name.fa || category.name.en, en: category.name.en || category.name.fa }
                    );
                  }}
                />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-100 truncate leading-tight pt-1">
                {diseaseTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/90 hover:bg-rose-900/90 text-slate-300 hover:text-white border border-slate-700 shadow-md backdrop-blur-md transition cursor-pointer flex items-center justify-center shrink-0"
            title={isFa ? 'بستن (Esc)' : 'Close (Esc)'}
            aria-label={isFa ? 'بستن' : 'Close'}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* SINGLE SCROLLABLE BODY */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto space-y-3.5 sm:space-y-4 md:space-y-5 text-xs sm:text-sm leading-relaxed custom-scrollbar flex-1 min-h-0">
          
          {/* STREAMLINED COMMON NAME & BRAND (1 Common Name + 1 Brand + Popup Trigger) */}
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800">
                <span className="font-bold text-slate-400 text-[10px] sm:text-[11px]">
                  {isFa ? 'نام رایج:' : 'Common Name:'}
                </span>
                <span className="font-bold text-sky-300 text-xs sm:text-sm">
                  {primaryCommonName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-800">
                <span className="font-bold text-slate-400 text-[10px] sm:text-[11px]">
                  {isFa ? 'برند اصلی استرالیا:' : 'Primary Brand:'}
                </span>
                <span className="font-bold text-amber-300 text-xs sm:text-sm">
                  {primaryBrand}
                </span>
              </div>
            </div>

            {/* Popup Trigger Button for Remaining Brands & Synonyms */}
            <button
              type="button"
              onClick={() => setShowBrandsPopup(true)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] sm:text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm group shrink-0"
            >
              <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 group-hover:text-white transition" />
              <span>
                {isFa
                  ? `مشاهده تمام برندها و نام‌ها (${australianBrands.length} برند)`
                  : `View All Brands & Synonyms (${australianBrands.length})`}
              </span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </button>
          </div>

          {/* 1. REORGANIZED & CATEGORIZED FIRST-LINE TREATMENT PROTOCOL */}
          <div className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 space-y-3 sm:space-y-4 shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 sm:pb-3">
              <h3 className="font-bold text-xs sm:text-sm text-emerald-300 flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isFa ? 'پروتکل خط اول درمان و راهنمای بالینی داروساز' : 'First-Line Treatment Protocol & Clinical Guidance'}</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                APF & PBA First-Line
              </span>
            </div>

            {/* Categorized Protocol Card */}
            <div className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5 sm:space-y-3.5 shadow-xs">
              {/* Top Title: Drug 1 & Class */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2.5 sm:pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center font-mono shrink-0">
                      1
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-200">
                      {firstLineDrug}
                    </span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-sky-300/90 font-medium flex items-center gap-1.5 pt-0.5">
                    <Tag className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>{isFa ? 'طبقه‌بندی دارویی:' : 'Class:'} {firstLineClass}</span>
                  </div>
                </div>
              </div>

              {/* Dosing Section: Population Segments Breakdown */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs sm:text-sm">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-sky-400" />
                  <span>{isFa ? 'دوزبندی و نحوه مصرف استرالیا (تفکیک رده‌های سنی):' : 'Australian Dosage & Administration by Age Group:'}</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                  {firstLineDosingSegments.map((seg, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-slate-200"
                    >
                      <span className="text-sm sm:text-base leading-none shrink-0 mt-0.5">{seg.icon}</span>
                      <div className="space-y-0.5 flex-1">
                        <span className="font-bold text-sky-300 text-[10px] sm:text-[11px] block">
                          {isFa ? seg.labelFa : seg.labelEn}:
                        </span>
                        <p className="text-xs sm:text-[13px] text-slate-100 font-medium leading-relaxed">
                          {seg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid 2-cols: Onset & Warnings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                {/* Onset & Course */}
                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs sm:text-sm">
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span>{isFa ? '⚡ شروع اثر و طول دوره:' : '⚡ Onset & Duration:'}</span>
                  </div>
                  <ul className="space-y-1 text-xs sm:text-[13px] text-slate-200">
                    {onsetBullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warnings & Precautions */}
                <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-rose-950/30 border border-rose-500/25 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs sm:text-sm">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{isFa ? '⚠️ هشدارهای کلیدی و احتیاطات:' : '⚠️ Key Warnings & Precautions:'}</span>
                  </div>
                  <ul className="space-y-1 text-xs sm:text-[13px] text-rose-200">
                    {warningsBullets.map((w, wIdx) => (
                      <li key={wIdx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 shrink-0">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Overview, Symptoms & Clinical Diagnostic Notes Block */}
            <div className="space-y-2.5 sm:space-y-3 pt-2.5 sm:pt-3 border-t border-emerald-500/20 text-slate-200">
              {/* 1. Condition Overview */}
              {cleanedOverview && (
                <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 sm:space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-300">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{isFa ? 'نمای کلی بیماری:' : 'Condition Overview:'}</span>
                  </div>
                  <p className="app-muted text-xs sm:text-[13px] leading-relaxed">{cleanedOverview}</p>
                </div>
              )}

              {/* 2. Pathophysiology & Clinical Presentations */}
              {resolvedSymptoms.length > 0 && (
                <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-300">
                    <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{isFa ? 'پاتوفیزیولوژی و علائم بالینی:' : 'Pathophysiology & Clinical Presentations:'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {resolvedSymptoms.map((sym, sIdx) => (
                      <span
                        key={sIdx}
                        dir="auto"
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-sky-950/70 text-sky-200 border border-sky-500/30 text-[11px] sm:text-xs font-medium"
                      >
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Clinical & Diagnostic Notes */}
              {resolvedClinicalNotes.length > 0 && (
                <div className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-amber-950/25 border border-amber-500/30 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{isFa ? 'نکات عملکردی و تشخیصی داروساز:' : 'Clinical & Diagnostic Notes:'}</span>
                  </div>
                  <ul className="space-y-1 text-xs sm:text-[13px] text-amber-200/90 font-medium">
                    {resolvedClinicalNotes.map((note, nIdx) => (
                      <li key={nIdx} dir="auto" className="flex items-start gap-1.5 leading-relaxed">
                        <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 2. APPROVED MEDICINES & CLINICAL DOSING GUIDE */}
          {medicines.length > 0 && (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm app-text flex items-center gap-1.5 text-indigo-300">
                  <Pill className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{isFa ? 'داروهای بدون نسخه، برندهای استرالیایی و دوزینگ (OTC Medicines & Dosing):' : 'Approved OTC Medicines, Australian Brands & Dosing:'}</span>
                </h4>
                <span className="text-[10px] sm:text-[11px] app-muted font-mono">{medicines.length} {isFa ? 'دارو' : 'options'}</span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {medicines.map((med: OTCDrugInfo, idx: number) => {
                  const isExpanded = !!expandedMedIds[idx];
                  const medDosingSegments = parseDosingToSegments(med.dosing, isFa);
                  const medNotes = parseExtraInfoToNotes(med.extraInfo);

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl sm:rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                        isExpanded
                          ? 'bg-slate-900/95 border-indigo-500/60 ring-1 ring-indigo-500/20'
                          : 'bg-slate-900/75 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      {/* Accordion Header - Clickable */}
                      <div
                        onClick={() => toggleMedExpand(idx)}
                        className="p-2.5 sm:p-3.5 flex items-center justify-between gap-2 sm:gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-[11px] sm:text-xs border border-indigo-500/30 flex items-center justify-center font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-xs sm:text-sm text-sky-400 truncate">
                              {med.name}
                            </div>
                            {!isExpanded && (
                              <div className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="text-amber-200/90 truncate">{med.brandExamples}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Pill & Chevron */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden sm:inline-block">
                            {isExpanded ? (isFa ? 'بستن' : 'Close') : (isFa ? 'مشاهده مشخصات' : 'View Details')}
                          </span>
                          <div className={`p-1 sm:p-1.5 rounded-lg border transition ${isExpanded ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Expanded Details */}
                      {isExpanded && (
                        <div className="p-2.5 sm:p-4 pt-2 border-t border-slate-800/80 space-y-2.5 sm:space-y-3 bg-slate-950/40 animate-fadeIn">
                          {/* Brands & Safety Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 sm:pb-2.5">
                            <div className="text-xs sm:text-sm text-amber-300/90 font-medium flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>
                                {isFa ? 'برندهای رایج استرالیا:' : 'Australian Brands:'}{' '}
                                <span className="font-bold text-amber-200">{med.brandExamples}</span>
                              </span>
                            </div>

                            {/* Badges: Age, Pregnancy, Lactation */}
                            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px]">
                              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-sky-950/80 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                                <Baby className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
                                <span className="font-medium">
                                  {isFa ? translateMedicineAttribute(med.minAge, 'minAge') : med.minAge}
                                </span>
                              </span>
                              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-purple-950/80 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                <HeartPulse className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                                <span className="font-medium">
                                  {isFa ? translateMedicineAttribute(med.pregnancySafety, 'pregnancy') : med.pregnancySafety}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Dosing Section: Population Segments */}
                          <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-1 text-emerald-400 text-xs sm:text-sm font-bold">
                              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{isFa ? 'دوزبندی تفکیک‌شده و نحوه مصرف استرالیا:' : 'Australian Dosage Breakdown by Population:'}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-1 sm:gap-1.5">
                              {medDosingSegments.map((seg, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm"
                                >
                                  <span className="text-sm sm:text-base leading-none shrink-0 mt-0.5">{seg.icon}</span>
                                  <div className="space-y-0.5 flex-1">
                                    <span className="font-bold text-emerald-300 text-[10px] sm:text-[11px] block">
                                      {isFa ? seg.labelFa : seg.labelEn}:
                                    </span>
                                    <p className="text-xs sm:text-[13px] text-slate-200 font-medium leading-relaxed">
                                      {isFa ? translateMedicineAttribute(seg.text, 'dosing') : seg.text}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Extra clinical pearls / notes on separate lines */}
                          {medNotes.length > 0 && (
                            <div className="text-xs sm:text-sm text-amber-200/90 bg-amber-950/25 border border-amber-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl space-y-1 sm:space-y-1.5">
                              <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] sm:text-xs">
                                <span>💡</span>
                                <span>{isFa ? 'نکات مهم بالینی و مشاوره‌ای داروساز:' : 'Pharmacist Clinical Pearls & Counseling Notes:'}</span>
                              </div>
                              <ul className="space-y-1 text-xs sm:text-[13px] text-amber-200/90 pr-2">
                                {medNotes.map((note, nIdx) => (
                                  <li key={nIdx} className="flex items-start gap-1.5 leading-relaxed">
                                    <span className="text-amber-400 shrink-0">•</span>
                                    <span>{isFa ? translateMedicineAttribute(note, 'extra') : note}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. PHARMACIST COUNSELING PROTOCOL & INSTRUCTIONS */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/80 border app-border space-y-2 sm:space-y-2.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs sm:text-sm border-b app-border pb-1.5 sm:pb-2">
              <Activity className="w-4 h-4 shrink-0" />
              <span>{isFa ? 'دستورالعمل مشاوره و پروتکل داروساز (Directions & Pharmacist Counseling):' : 'Directions for Use & Pharmacist Counseling Protocol:'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
              {pharmacistInstructions}
            </p>
          </div>

          {/* 4. RED FLAGS / REFERRAL CRITERIA (FULL WIDTH) */}
          {redFlagsList.length > 0 && (
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-2 sm:space-y-2.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs sm:text-sm border-b border-rose-500/20 pb-1.5 sm:pb-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{isFa ? 'معیارهای ارجاع فوری به پزشک (Red Flags):' : 'Urgent Referral Criteria (Red Flags):'}</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-rose-200 font-medium">
                {redFlagsList.map((ref, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 sm:gap-2 bg-rose-950/30 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-rose-500/20">
                    <span className="text-rose-400 font-bold shrink-0">🚩</span>
                    <span className="leading-relaxed">{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Module Jump if available */}
          {onNavigateToModule && (
            <div className="pt-1.5 sm:pt-2 flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule(2);
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/40 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isFa ? 'مشاهده در قفسه محصولات (ماژول ۲)' : 'View in Product Shelf (Module 2)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* FIXED BOTTOM FOOTER */}
        <div className="px-4 sm:px-6 py-3 border-t app-border bg-slate-950/90 backdrop-blur-md flex items-center justify-between shrink-0 gap-3">
          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Australian Pharmacy Formulary (APF) & PBA Monograph
          </div>
          <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
            {onNavigateToModule && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule(2);
                }}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/40 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isFa ? 'مشاهده در قفسه محصولات (ماژول ۲)' : 'View in Product Shelf (Module 2)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-bold transition border border-slate-700 cursor-pointer shadow-xs"
            >
              {isFa ? 'بستن' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: Full Australian Brands & Synonyms Guide */}
      {showBrandsPopup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn overflow-hidden"
          onClick={(e) => {
            e.stopPropagation();
            setShowBrandsPopup(false);
          }}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl app-card border border-indigo-500/40 shadow-2xl bg-slate-950 app-text overflow-hidden my-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-indigo-500/20 shrink-0 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                    <span>{isFa ? 'فهرست جامع برندها و نام‌های رایج' : 'Australian Brands & Clinical Synonyms'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {australianBrands.length} {isFa ? 'برند' : 'Brands'}
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                    {diseaseTitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBrandsPopup(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 cursor-pointer"
                title={isFa ? 'بستن' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Australian Commercial Brands Section */}
            <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-3.5 custom-scrollbar text-xs sm:text-sm">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-300 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                    <span>{isFa ? 'برندهای تجاری موجود در داروخانه‌های استرالیا:' : 'Australian Pharmacy Brand Names:'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">TGA Approved</span>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  {australianBrands.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-xs sm:text-sm space-y-1 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-amber-300 text-xs sm:text-[13px]">
                          {b.brand}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-mono text-[10px]">
                          {b.generic}
                        </span>
                      </div>
                      {b.form && (
                        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed pt-0.5">
                          {b.form}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Synonyms & Slang Terms Section */}
              {allSynonyms.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs sm:text-sm font-bold text-sky-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isFa ? 'سایر نام‌های عامیانه، مترادف‌ها و واژگان تخصصی:' : 'Synonyms, Lay Terms & Clinical Aliases:'}</span>
                  </span>

                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {allSynonyms.map((syn, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-slate-900 text-slate-200 text-[11px] sm:text-xs font-medium border border-slate-700/80"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 flex justify-end shrink-0 bg-slate-900/80">
              <button
                type="button"
                onClick={() => setShowBrandsPopup(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {isFa ? 'بستن پنجره' : 'Close Window'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

