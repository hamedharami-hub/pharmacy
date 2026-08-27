'use client';

import React, { useState, useMemo } from 'react';
import {
  Product,
  ClinicalDomainCategory,
  ClinicalSubCategory,
  ClinicalDomain,
  SubCategory,
  CalLabelInfo,
  StateStorageRule,
  ClinicalConcept,
} from '@/types/shelf';
import { Language, DiseaseInfo } from '@/types/pharmacy';
import { CLINICAL_DOMAINS } from '@/data/shelf/clinicalDomains';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';
import { CLINICAL_CONCEPTS_REGISTRY } from '@/data/shelf/clinicalConcepts';
import { CAL_LABELS_DICT } from '@/data/shelf/calLabels';
import { STATE_STORAGE_RULES } from '@/data/shelf/stateStorageRules';
import {
  getConceptsForProduct,
  getConceptsForSubCategory,
  getDiseasesForSubCategory,
} from '@/data/shelf/diseaseHelpers';
import {
  DrugMechanismInfo,
  getProductMechanism,
  getCategoryMechanism,
} from '@/data/mechanismsRegistry';

import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStudyTrackerContext } from './study/StudyTrackerContext';
import { MobileShelfCardDeck } from './shelf/MobileShelfCardDeck';
import { ShelfDrugCard } from './shelf/ShelfDrugCard';
import { ShelfDomainSelector } from './shelf/ShelfDomainSelector';
import { ShelfSubcategoriesAccordion } from './shelf/ShelfSubcategoriesAccordion';
import { ShelfCommonMechanismAccordion } from './shelf/ShelfCommonMechanismAccordion';
import { ShelfGroupingAccordion } from './shelf/ShelfGroupingAccordion';
import { FormattedClinicalText } from './shelf/FormattedClinicalText';
import { DiseaseCategoryExplorer } from './DiseaseCategoryExplorer';

// Dynamically imported modals & heavy drawers
const ShelfSearchDrawer = dynamic(
  () => import('./shelf/ShelfSearchDrawer').then((mod) => mod.ShelfSearchDrawer),
  { ssr: false }
);

const ShelfStateStorageTester = dynamic(
  () => import('./shelf/ShelfStateStorageTester').then((mod) => mod.ShelfStateStorageTester),
  { ssr: false }
);

const CalInfoModal = dynamic(
  () => import('./shelf/CalInfoModal').then((mod) => mod.CalInfoModal),
  { ssr: false }
);

const ProjectStopModal = dynamic(
  () => import('./shelf/ProjectStopModal').then((mod) => mod.ProjectStopModal),
  { ssr: false }
);

const DrugComparisonModal = dynamic(
  () => import('./shelf/DrugComparisonModal').then((mod) => mod.DrugComparisonModal),
  { ssr: false }
);

const ConceptDetailModal = dynamic(
  () => import('./shelf/ConceptDetailModal').then((mod) => mod.ConceptDetailModal),
  { ssr: false }
);

const DrugMechanismModal = dynamic(
  () => import('./shelf/DrugMechanismModal').then((mod) => mod.DrugMechanismModal),
  { ssr: false }
);

const ClinicalMatricesPanel = dynamic(
  () => import('./ClinicalMatricesPanel').then((mod) => mod.ClinicalMatricesPanel),
  { ssr: false }
);

const DiseaseDetailModal = dynamic(
  () => import('./DiseaseDetailModal').then((mod) => mod.DiseaseDetailModal),
  { ssr: false }
);

import {
  Search,
  Stethoscope,
  Sparkles,
  Boxes,
  Pill,
  Dna,
  Layers,
  Activity,
  BookOpen,
  ShieldCheck,
  Filter,
} from 'lucide-react';

// Re-export helpers and types for backward compatibility across modules
export {
  getConceptsForProduct,
  getConceptsForSubCategory,
  getDiseasesForSubCategory,
  FormattedClinicalText,
  CLINICAL_DOMAINS,
  SHELF_PRODUCTS,
  CLINICAL_CONCEPTS_REGISTRY,
  CAL_LABELS_DICT,
  STATE_STORAGE_RULES,
};
export type {
  Product,
  ClinicalDomainCategory,
  ClinicalSubCategory,
  ClinicalDomain,
  SubCategory,
  CalLabelInfo,
  StateStorageRule,
  ClinicalConcept,
};

interface ProductShelfModuleProps {
  language: Language;
  onNavigateToModule?: (moduleNumber: 1 | 2 | 3 | 4 | 5 | 6, contextId?: string) => void;
  onOpenAiLeitner?: (text: string, module: 1 | 2 | 4, category?: string, topic?: string) => void;
}

export const ProductShelfModule: React.FC<ProductShelfModuleProps> = ({
  language,
  onNavigateToModule,
  onOpenAiLeitner,
}) => {
  const isFa = language === 'fa';

  // Core Filter & Search States
  const [selectedSchedule, setSelectedSchedule] = useState<'ALL' | 'Unscheduled' | 'S2' | 'S3' | 'S4' | 'S8'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [diseaseSearchQuery, setDiseaseSearchQuery] = useState('');
  const [matricesSearchQuery, setMatricesSearchQuery] = useState('');
  const [searchInputText, setSearchInputText] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Main View Switcher ('shelf' | 'diseases' | 'matrices')
  const [activeShelfView, setActiveShelfView] = useState<'shelf' | 'diseases' | 'matrices'>('shelf');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProjectStopOpen, setIsProjectStopOpen] = useState(false);

  // Domain & SubCategory Tree State
  const [selectedDomainId, setSelectedDomainId] = useState<string>('cat-1');
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('sub-1-1');
  const [sortOrder, setSortOrder] = useState<'SUBCATEGORY' | 'MECHANISM' | 'ALPHABETICAL' | 'SCHEDULE'>('SUBCATEGORY');

  // Search Scope States
  const [searchDomainScope, setSearchDomainScope] = useState<string>('ALL');
  const [searchSubCatScope, setSearchSubCatScope] = useState<string>('ALL');

  // Multi-Attribute Tag Filters
  const [activeScheduleTags, setActiveScheduleTags] = useState<string[]>([]);
  const [activeCalTags, setActiveCalTags] = useState<string[]>([]);
  const [activeSafetyTags, setActiveSafetyTags] = useState<string[]>([]);
  const [substitutionFilter, setSubstitutionFilter] = useState<'ALL' | 'A_FLAG' | 'NTI'>('ALL');
  const [activeMechanismFilter, setActiveMechanismFilter] = useState<string>('ALL');
  const [isGroupedByMechanism, setIsGroupedByMechanism] = useState<boolean>(false);

  // 3 Accordion Expand/Collapse States (Collapsed by default)
  const [isSubcategoriesAccordionOpen, setIsSubcategoriesAccordionOpen] = useState<boolean>(false);
  const [isGroupingAccordionOpen, setIsGroupingAccordionOpen] = useState<boolean>(false);
  const [isCommonMechanismAccordionOpen, setIsCommonMechanismAccordionOpen] = useState<boolean>(false);

  // Selected Detail Modal Data
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);
  const [selectedMechanismInfo, setSelectedMechanismInfo] = useState<DrugMechanismInfo | null>(null);
  const [selectedCalInfo, setSelectedCalInfo] = useState<CalLabelInfo | null>(null);
  // State Storage Tester
  const [selectedState, setSelectedState] = useState<string>('NSW');

  // Project Stop Verification Form State
  const [patientId, setPatientId] = useState('DL-9824017');
  const [patientName, setPatientName] = useState('Sarah Jenkins');
  const [idType, setIdType] = useState<'Driver License' | 'Passport' | 'Proof of Age'>('Driver License');
  const [counselingCompleted, setCounselingCompleted] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [approvalCode, setApprovalCode] = useState<string>('');

  // Active domain and subcategory resolution
  const activeDomain = CLINICAL_DOMAINS.find((d) => d.id === selectedDomainId) || CLINICAL_DOMAINS[0];
  const activeSubCat =
    activeDomain.subcategories.find((s) => s.id === selectedSubCatId) || activeDomain.subcategories[0];

  // Actions
  const handleSelectDomain = (domainId: string) => {
    setSelectedDomainId(domainId);
    const domain = CLINICAL_DOMAINS.find((d) => d.id === domainId);
    if (domain && domain.subcategories.length > 0) {
      setSelectedSubCatId(domain.subcategories[0].id);
    }
  };

  const toggleScheduleTag = (tag: string) => {
    setActiveScheduleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCalTag = (calCode: string) => {
    setActiveCalTags((prev) =>
      prev.includes(calCode) ? prev.filter((c) => c !== calCode) : [...prev, calCode]
    );
  };

  const toggleSafetyTag = (tag: string) => {
    setActiveSafetyTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSearchInputText('');
    setSearchDomainScope('ALL');
    setSearchSubCatScope('ALL');
    setSelectedSchedule('ALL');
    setActiveScheduleTags([]);
    setActiveCalTags([]);
    setActiveSafetyTags([]);
    setSubstitutionFilter('ALL');
    setActiveMechanismFilter('ALL');
    setIsGroupedByMechanism(false);
  };

  const handleSelectProduct = (prod: Product) => {
    setActiveProduct(prod);
    if (prod.requiresProjectStop) {
      setIsProjectStopOpen(true);
      setIsApproved(null);
      setApprovalCode('');
    }
  };

  const handleVerifyProjectStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim().length >= 4 && patientName.trim().length >= 3 && counselingCompleted) {
      setIsApproved(true);
      const randomCode = `PS-2026-${Math.floor(10000 + Math.random() * 90000)}-OK`;
      setApprovalCode(randomCode);
    } else {
      setIsApproved(false);
    }
  };

  // Products Filtering & Sorting Engine
  const filteredProducts = useMemo(() => {
    return SHELF_PRODUCTS.filter((prod) => {
      // Schedule top tab
      if (selectedSchedule !== 'ALL' && prod.schedule !== selectedSchedule) return false;

      // Substitution & Bioequivalence Filter (A-Flag vs NTI)
      if (substitutionFilter === 'A_FLAG' && !prod.aFlagBioequivalent) return false;
      if (substitutionFilter === 'NTI' && !prod.isNarrowTherapeuticIndex) return false;

      // Pharmacological Mechanism Filter
      if (activeMechanismFilter !== 'ALL') {
        const prodMech = getProductMechanism(prod);
        if (prodMech.classCode !== activeMechanismFilter) return false;
      }

      // Multi-tag: Schedule tags
      if (activeScheduleTags.length > 0) {
        const matchSched = activeScheduleTags.some((st) => {
          if (st === 'Project Stop') return prod.requiresProjectStop === true;
          return prod.schedule === st;
        });
        if (!matchSched) return false;
      }

      // Multi-tag: CAL tags
      if (activeCalTags.length > 0) {
        const matchCal = activeCalTags.every((c) => prod.calLabels.includes(c));
        if (!matchCal) return false;
      }

      // Multi-tag: Safety tags
      if (activeSafetyTags.length > 0) {
        const corpusFa = `${prod.brandName} ${prod.genericName} ${prod.activeIngredients} ${prod.indications.fa} ${prod.counselingPoints.map((c) => c.fa).join(' ')}`.toLowerCase();
        const corpusEn = `${prod.brandName} ${prod.genericName} ${prod.activeIngredients} ${prod.indications.en} ${prod.counselingPoints.map((c) => c.en).join(' ')}`.toLowerCase();

        const matchSafety = activeSafetyTags.every((st) => {
          if (st === 'Pregnancy Safe') {
            return corpusFa.includes('بارداری') || corpusEn.includes('pregnancy') || corpusEn.includes('category a');
          }
          if (st === 'Paediatric Restricted') {
            return corpusFa.includes('کودکان') || corpusEn.includes('paediatric') || corpusFa.includes('زیر ۶ سال') || corpusEn.includes('<6');
          }
          if (st === 'TDM Required') {
            return corpusFa.includes('tdm') || corpusEn.includes('tdm') || corpusFa.includes('پایش') || corpusEn.includes('narrow') || corpusFa.includes('سطح خونی');
          }
          if (st === 'CYP Inhibitor') {
            return corpusFa.includes('مهارکننده') || corpusEn.includes('inhibitor') || corpusEn.includes('cyp3a4') || corpusEn.includes('cyp2d6') || corpusEn.includes('cyp2c19');
          }
          if (st === 'CYP Inducer') {
            return corpusFa.includes('القاکننده') || corpusEn.includes('inducer') || corpusEn.includes('cyp1a2') || corpusEn.includes('smoking');
          }
          return true;
        });
        if (!matchSafety) return false;
      }

      // Advanced Scope Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          prod.brandName.toLowerCase().includes(q) ||
          prod.genericName.toLowerCase().includes(q) ||
          prod.activeIngredients.toLowerCase().includes(q) ||
          prod.indications.fa.toLowerCase().includes(q) ||
          prod.indications.en.toLowerCase().includes(q) ||
          prod.counselingPoints.some((cp) => cp.fa.toLowerCase().includes(q) || cp.en.toLowerCase().includes(q));

        if (!matchesText) return false;

        if (searchDomainScope !== 'ALL' && prod.domainId !== searchDomainScope) return false;
        if (searchSubCatScope !== 'ALL' && prod.subcategoryId !== searchSubCatScope) return false;

        return true;
      }

      // Default Domain & Subcategory Filtering
      const hasActiveTagFilters =
        activeScheduleTags.length > 0 || activeCalTags.length > 0 || activeSafetyTags.length > 0;

      if (!hasActiveTagFilters) {
        if (prod.domainId && prod.domainId !== selectedDomainId) return false;
        if (selectedSubCatId && prod.subcategoryId && prod.subcategoryId !== selectedSubCatId) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'MECHANISM') {
        const mechA = getProductMechanism(a).classNameEn || '';
        const mechB = getProductMechanism(b).classNameEn || '';
        const comp = mechA.localeCompare(mechB);
        if (comp !== 0) return comp;
        return a.genericName.localeCompare(b.genericName);
      }
      if (sortOrder === 'ALPHABETICAL') {
        return a.genericName.localeCompare(b.genericName);
      }
      if (sortOrder === 'SCHEDULE') {
        const schedWeight: Record<string, number> = { S8: 4, S4: 3, S3: 2, S2: 1, Unscheduled: 0 };
        return (schedWeight[b.schedule] || 0) - (schedWeight[a.schedule] || 0);
      }
      // Default: SUBCATEGORY
      return (a.subcategoryId || '').localeCompare(b.subcategoryId || '');
    });
  }, [
    selectedSchedule,
    substitutionFilter,
    activeMechanismFilter,
    activeScheduleTags,
    activeCalTags,
    activeSafetyTags,
    searchDomainScope,
    searchSubCatScope,
    selectedDomainId,
    selectedSubCatId,
    sortOrder,
    searchQuery,
  ]);

  const isMobile = useIsMobile();
  const [isMobileSelectorCollapsed, setIsMobileSelectorCollapsed] = useState(false);
  const { studyState } = useStudyTrackerContext();
  const activeSearchValue =
    activeShelfView === 'shelf'
      ? searchQuery
      : activeShelfView === 'diseases'
        ? diseaseSearchQuery
        : matricesSearchQuery;
  const setActiveSearchValue = (value: string) => {
    if (activeShelfView === 'shelf') setSearchQuery(value);
    else if (activeShelfView === 'diseases') setDiseaseSearchQuery(value);
    else setMatricesSearchQuery(value);
  };

  // Get last 2-3 unique recently studied items for Module 2/3/4
  const recentHistoryItems = useMemo(() => {
    const items: Array<{ itemId: string; moduleId: number; itemTitle: { fa: string; en: string }; routeContext?: any }> = [];
    if (studyState?.lastStudiedGlobal) {
      items.push({
        itemId: studyState.lastStudiedGlobal.itemId,
        moduleId: studyState.lastStudiedGlobal.moduleId,
        itemTitle: studyState.lastStudiedGlobal.title,
        routeContext: studyState.lastStudiedGlobal.routeContext,
      });
    }
    if (studyState?.lastStudiedByModule) {
      Object.values(studyState.lastStudiedByModule).forEach((m) => {
        if (m && !items.some((it) => it.itemId === m.itemId)) {
          items.push({
            itemId: m.itemId,
            moduleId: m.moduleId,
            itemTitle: m.title,
            routeContext: m.routeContext,
          });
        }
      });
    }
    return items.slice(0, 3);
  }, [studyState]);

  return (
    <div className="space-y-4">
      {/* 0. RECENTLY STUDIED ITEMS STRIP (Quick 1-Tap Access) */}
      {recentHistoryItems.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] font-bold app-muted shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFa ? 'مطالعه‌های اخیر:' : 'Recent:'}</span>
          </span>
          {recentHistoryItems.map((h, idx) => (
            <button
              key={`${h.itemId}-${idx}`}
              type="button"
              onClick={() => {
                if (h.moduleId === 2 && h.routeContext?.subCategoryId) {
                  setSelectedSubCatId(h.routeContext.subCategoryId);
                  if (h.routeContext.domainId) setSelectedDomainId(h.routeContext.domainId);
                  setIsMobileSelectorCollapsed(true);
                } else if (onNavigateToModule && h.moduleId) {
                  onNavigateToModule(h.moduleId as 1 | 2 | 3 | 4 | 5 | 6);
                }
              }}
              className="px-2.5 py-1 rounded-lg app-bg border app-border hover:border-teal-500/50 text-[11px] font-medium app-text truncate max-w-[200px] shrink-0 flex items-center gap-1 transition cursor-pointer"
            >
              <span className="text-[10px] opacity-70">M{h.moduleId}</span>
              <span className="truncate">{h.itemTitle ? (isFa ? h.itemTitle.fa : h.itemTitle.en) : h.itemId}</span>
            </button>
          ))}
        </div>
      )}

      {/* UNIFIED MODULE 2 TOP NAVIGATION & SEARCH */}
      <div className="space-y-3">
        {/* 1. SUB-NAVIGATION TABS ROW */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full text-xs">
          <button
            type="button"
            onClick={() => setActiveShelfView('shelf')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer border ${
              activeShelfView === 'shelf'
                ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                : 'app-bg app-border app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{isFa ? 'قفسه محصولات و داروها' : 'Shelf Medicines'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveShelfView('diseases')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer border ${
              activeShelfView === 'diseases'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm ring-1 ring-emerald-400/40'
                : 'app-bg app-border app-muted hover:app-text hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isFa ? 'راهنمای بیماری‌ها' : 'Clinical Diseases'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveShelfView('matrices')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer border ${
              activeShelfView === 'matrices'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                : 'app-bg app-border app-muted hover:app-text hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isFa ? 'ماتریکس پروتکل‌ها' : 'Clinical Protocols & Matrices'}</span>
          </button>
        </div>

        {/* 2. REAL-TIME SEARCH BAR & ADVANCED FILTERS TRIGGER */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={activeSearchValue}
              onChange={(e) => setActiveSearchValue(e.target.value)}
              placeholder={
                activeShelfView === 'shelf'
                  ? isFa
                    ? 'جستجوی آنی در نام برند، نام ژنریک، دوز، اندیکاسیون‌ها، کدهای PBS و نکات بالینی...'
                    : 'Real-time quick search across brand names, generics, indications, PBS codes & CAL labels...'
                  : activeShelfView === 'diseases'
                    ? isFa
                      ? 'جستجوی نام بیماری، علائم یا نام‌های رایج...'
                      : 'Search disease names, symptoms or common names...'
                    : isFa
                      ? 'جستجوی پاتوژن، پروتکل پایش، واکسن یا دارو...'
                      : 'Search pathogens, monitoring protocols, vaccines or drugs...'
              }
              className="w-full pr-10 pl-4 py-2 rounded-xl border app-border bg-black/30 text-xs app-text focus:outline-none focus:border-teal-500 shadow-inner"
            />
            {activeSearchValue.trim() && (
              <button
                type="button"
                onClick={() => setActiveSearchValue('')}
                className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {activeShelfView === 'shelf' && (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeScheduleTags.length > 0 || activeCalTags.length > 0 || activeSafetyTags.length > 0 || substitutionFilter !== 'ALL'
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-950/40 ring-1 ring-sky-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isFa ? 'فیلترهای پیشرفته برچسب‌های هشدار، ایمنی و جدول‌بندی' : 'Advanced Multi-Tag Filters (CAL, Safety, Schedules)'}
            >
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{isFa ? 'فیلترهای پیشرفته' : 'Advanced Filters'}</span>
              {(activeScheduleTags.length > 0 || activeCalTags.length > 0 || activeSafetyTags.length > 0 || substitutionFilter !== 'ALL') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: CLINICAL MATRICES & PROTOCOLS PANEL */}
      {activeShelfView === 'matrices' && (
        <ClinicalMatricesPanel
          language={language}
          searchQuery={matricesSearchQuery}
          onSearchQueryChange={setMatricesSearchQuery}
          onFilterShelfByConcept={(conceptId) => {
            setSelectedConceptId(conceptId);
            setActiveShelfView('shelf');
          }}
        />
      )}

      {/* VIEW 2: INTERACTIVE DISEASES & TREATMENT EXPLORER PANEL */}
      {activeShelfView === 'diseases' && (
        <DiseaseCategoryExplorer
          language={language}
          onSelectDisease={(disease) => setSelectedDisease(disease)}
          searchQuery={diseaseSearchQuery}
          onSearchQueryChange={setDiseaseSearchQuery}
        />
      )}

      {/* COLLAPSIBLE ADVANCED SEARCH DRAWER */}
      <ShelfSearchDrawer
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        language={language}
        searchInputText={searchInputText}
        setSearchInputText={setSearchInputText}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchDomainScope={searchDomainScope}
        setSearchDomainScope={setSearchDomainScope}
        searchSubCatScope={searchSubCatScope}
        setSearchSubCatScope={setSearchSubCatScope}
        clinicalDomains={CLINICAL_DOMAINS}
        calLabelsDict={CAL_LABELS_DICT}
        activeScheduleTags={activeScheduleTags}
        toggleScheduleTag={toggleScheduleTag}
        activeCalTags={activeCalTags}
        toggleCalTag={toggleCalTag}
        activeSafetyTags={activeSafetyTags}
        toggleSafetyTag={toggleSafetyTag}
        substitutionFilter={substitutionFilter}
        setSubstitutionFilter={setSubstitutionFilter}
        selectedSchedule={selectedSchedule}
        setSelectedSchedule={setSelectedSchedule}
        filteredProductsCount={filteredProducts.length}
        resetAllFilters={resetAllFilters}
      />

      {/* VIEW 3: MAIN PRODUCT SHELF (WHEN SHELF TAB IS ACTIVE) */}
      {activeShelfView === 'shelf' && (
        <>
          {/* UNIFIED CARD DECK & SELECTOR EXPERIENCE (MOBILE & DESKTOP) */}
          {isMobile ? (
            <div className="space-y-4">
              {!isMobileSelectorCollapsed ? (
                /* Mobile Selector Card: Choose Domain & Subcategory then Confirm */
                <div className="app-card border border-teal-500/40 rounded-2xl p-4 space-y-4 shadow-lg bg-linear-to-b from-teal-950/20 to-transparent animate-fadeIn">
                  <div className="border-b app-border pb-2 flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black app-text flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-400" />
                      <span>{isFa ? 'انتخاب سرفصل و زیرمجموعه بالینی' : 'Select Domain & Subcategory'}</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <ShelfDomainSelector
                      clinicalDomains={CLINICAL_DOMAINS}
                      selectedDomainId={selectedDomainId}
                      onSelectDomain={handleSelectDomain}
                      language={language}
                    />

                    <ShelfSubcategoriesAccordion
                      activeDomain={activeDomain}
                      activeSubCat={activeSubCat}
                      isOpen={isSubcategoriesAccordionOpen}
                      onToggleOpen={() => setIsSubcategoriesAccordionOpen((prev) => !prev)}
                      onSelectSubCatId={(id) => setSelectedSubCatId(id)}
                      onSelectDisease={setSelectedDisease}
                      language={language}
                      hideClinicalProfile={true}
                    />
                  </div>

                  {/* Big Confirmation Button: Collapses selector and shows interactive card deck */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSelectorCollapsed(true);
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 cursor-pointer transition active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isFa ? '✨ مشاهده و مطالعه کارت‌ها (View Cards)' : '✨ View & Study Cards'}</span>
                  </button>
                </div>
              ) : (
                /* Mobile Interactive Gesture-Driven Card Deck */
                <MobileShelfCardDeck
                  activeDomain={activeDomain}
                  activeSubCat={activeSubCat}
                  products={filteredProducts}
                  language={language}
                  onOpenSelector={() => setIsMobileSelectorCollapsed(false)}
                  onSelectDisease={setSelectedDisease}
                  onSelectProduct={handleSelectProduct}
                  onSelectSchedule={(sched) => setSelectedSchedule(sched as any)}
                  onSelectMechanism={setSelectedMechanismInfo}
                  onSelectCalInfo={setSelectedCalInfo}
                  onSelectConceptId={setSelectedConceptId}
                  onOpenProjectStop={(prod) => {
                    setActiveProduct(prod);
                    setIsProjectStopOpen(true);
                  }}
                  sortOrder={sortOrder}
                  onSelectSortOrder={setSortOrder}
                  onNavigateToModule={onNavigateToModule}
                  onOpenAiLeitner={onOpenAiLeitner}
                />
              )}
            </div>
          ) : (
            /* DESKTOP EXPERIENCE: MODERN CARD-CENTRIC STUDY HUB */
            <div className="space-y-4 my-2">
              {!isMobileSelectorCollapsed ? (
                /* Desktop Selector Card */
                <div className="app-card border border-teal-500/40 rounded-3xl p-5 space-y-4 shadow-xl bg-linear-to-b from-teal-950/25 via-slate-900/30 to-transparent animate-fadeIn">
                  <div className="border-b app-border pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black app-text">
                          {isFa ? 'انتخاب سرفصل بالینی و زیرمجموعه' : 'Select Clinical Domain & Subcategory'}
                        </h3>
                        <p className="text-xs app-muted">
                          {isFa
                            ? 'دامنه بالینی و زیرمجموعه دارویی مورد نظر را انتخاب و دکمه ورود به کارت‌ها را بزنید.'
                            : 'Choose your clinical domain and subcategory, then click View Cards.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <ShelfDomainSelector
                      clinicalDomains={CLINICAL_DOMAINS}
                      selectedDomainId={selectedDomainId}
                      onSelectDomain={handleSelectDomain}
                      language={language}
                    />

                    <ShelfSubcategoriesAccordion
                      activeDomain={activeDomain}
                      activeSubCat={activeSubCat}
                      isOpen={isSubcategoriesAccordionOpen}
                      onToggleOpen={() => setIsSubcategoriesAccordionOpen((prev) => !prev)}
                      onSelectSubCatId={(id) => setSelectedSubCatId(id)}
                      onSelectDisease={setSelectedDisease}
                      language={language}
                      hideClinicalProfile={true}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileSelectorCollapsed(true)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-teal-950/50 cursor-pointer transition hover:scale-[1.005] active:scale-99"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>{isFa ? '✨ مشاهده و مطالعه کامل سرفصل و داروها (View Cards & Shelf)' : '✨ View Cards & Shelf'}</span>
                  </button>
                </div>
              ) : (
                /* Desktop Focused Card Hub */
                <div className="space-y-4 animate-fadeIn">
                  {/* Top Hub Bar */}
                  <div className="app-card border app-border rounded-2xl p-3.5 flex items-center justify-between gap-4 shadow-sm bg-linear-to-r from-slate-900/60 to-transparent">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black app-text truncate">
                            {isFa ? activeSubCat.titleFa : activeSubCat.titleEn}
                          </h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-mono font-bold">
                            {activeDomain.titleEn}
                          </span>
                        </div>
                        <p className="text-xs app-muted mt-0.5" dir="ltr">
                          {activeSubCat.titleEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsMobileSelectorCollapsed(false)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Search className="w-4 h-4" />
                        <span>{isFa ? 'تغییر سرفصل و جستجو' : 'Change Topic'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Clinical Specifications Card */}
                  <ShelfSubcategoriesAccordion
                    activeDomain={activeDomain}
                    activeSubCat={activeSubCat}
                    isOpen={false}
                    onToggleOpen={() => setIsMobileSelectorCollapsed(false)}
                    onSelectSubCatId={(id) => setSelectedSubCatId(id)}
                    onSelectDisease={setSelectedDisease}
                    language={language}
                  />

                  {/* 2. Common Mechanism Accordion */}
                  <ShelfCommonMechanismAccordion
                    targetId={activeSubCat.id}
                    activeSubCat={activeSubCat}
                    isOpen={isCommonMechanismAccordionOpen}
                    onToggleOpen={() => setIsCommonMechanismAccordionOpen((prev) => !prev)}
                    activeMechanismFilter={activeMechanismFilter}
                    onToggleMechanismFilter={(nameEn) => {
                      setActiveMechanismFilter((prev) => (prev === nameEn ? 'ALL' : nameEn));
                    }}
                    onSelectConceptId={setSelectedConceptId}
                    language={language}
                  />

                  {/* 3. Medicines Shelf: Clean List of Drug Cards */}
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-sky-400" />
                        <h3 className="text-base font-bold text-white">
                          {isFa
                            ? `لیست داروهای سرفصل (${filteredProducts.length} محصول):`
                            : `Medicines in ${activeSubCat.titleEn} (${filteredProducts.length} products):`}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsGroupingAccordionOpen((prev) => !prev)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Filter className="w-3.5 h-3.5 text-sky-400" />
                        <span>{isFa ? 'مرتب‌سازی و فیلترها' : 'Sorting & Filters'}</span>
                      </button>
                    </div>

                    {isGroupingAccordionOpen && (
                      <ShelfGroupingAccordion
                        isOpen={isGroupingAccordionOpen}
                        onToggleOpen={() => setIsGroupingAccordionOpen((prev) => !prev)}
                        isGroupedByMechanism={isGroupedByMechanism}
                        onToggleGroupedByMechanism={() => setIsGroupedByMechanism((prev) => !prev)}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        selectedSchedule={selectedSchedule}
                        setSelectedSchedule={setSelectedSchedule}
                        substitutionFilter={substitutionFilter}
                        setSubstitutionFilter={setSubstitutionFilter}
                        language={language}
                      />
                    )}

                    {/* Drug Cards List */}
                    <div className="space-y-3">
                      {filteredProducts.map((prod) => (
                        <ShelfDrugCard
                          key={prod.id}
                          prod={prod}
                          language={language}
                          calLabelsDict={CAL_LABELS_DICT}
                          onSelectSchedule={(sched) => setSelectedSchedule(sched as any)}
                          onSelectMechanism={setSelectedMechanismInfo}
                          onSelectCalInfo={setSelectedCalInfo}
                          onSelectConceptId={setSelectedConceptId}
                          onOpenProjectStop={() => {
                            setActiveProduct(prod);
                            setIsProjectStopOpen(true);
                          }}
                          onOpenAiLeitner={onOpenAiLeitner}
                          onNavigateToModule={onNavigateToModule}
                        />
                      ))}
                    </div>
                  </div>

                  {/* State Storage Rules Tester */}
                  <ShelfStateStorageTester
                    selectedState={selectedState}
                    onSelectState={setSelectedState}
                    stateStorageRules={STATE_STORAGE_RULES}
                    language={language}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* PROJECT STOP VERIFICATION MODAL */}
      <ProjectStopModal
        isOpen={isProjectStopOpen}
        activeProduct={activeProduct}
        language={language}
        patientName={patientName}
        setPatientName={setPatientName}
        idType={idType}
        setIdType={setIdType}
        patientId={patientId}
        setPatientId={setPatientId}
        counselingCompleted={counselingCompleted}
        setCounselingCompleted={setCounselingCompleted}
        isApproved={isApproved}
        approvalCode={approvalCode}
        onVerify={handleVerifyProjectStop}
        onClose={() => setIsProjectStopOpen(false)}
      />

      {/* CAL LABEL DETAIL INFO MODAL */}
      <CalInfoModal
        selectedCalInfo={selectedCalInfo}
        language={language}
        onClose={() => setSelectedCalInfo(null)}
      />

      {/* SHARED CLINICAL CONCEPT DETAIL MODAL */}
      <ConceptDetailModal
        selectedConceptId={selectedConceptId}
        products={SHELF_PRODUCTS}
        domains={CLINICAL_DOMAINS}
        language={language}
        onClose={() => setSelectedConceptId(null)}
        onSelectProduct={(p) => handleSelectProduct(p)}
        onSelectSubCat={(subCatId) => {
          setSelectedSubCatId(subCatId);
          setIsSubcategoriesAccordionOpen(true);
        }}
        onApplySearchQuery={(q) => {
          setSearchQuery(q);
          setSearchInputText(q);
          setIsSearchOpen(true);
        }}
      />

      {/* DRUG MECHANISM OF ACTION MODAL */}
      <DrugMechanismModal
        selectedMechanismInfo={selectedMechanismInfo}
        products={SHELF_PRODUCTS}
        language={language}
        onClose={() => setSelectedMechanismInfo(null)}
        onSelectProduct={(p) => handleSelectProduct(p)}
        onApplyMechanismFilter={(classCode) => {
          setActiveMechanismFilter(classCode);
        }}
      />

      {/* DISEASE DETAIL POP-UP MODAL */}
      {selectedDisease && (
        <DiseaseDetailModal
          disease={selectedDisease}
          language={language}
          onClose={() => setSelectedDisease(null)}
        />
      )}

    </div>
  );
};
