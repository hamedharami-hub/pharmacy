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

// Sub-components
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
  const [searchInputText, setSearchInputText] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Main View Switcher ('shelf' | 'diseases' | 'matrices')
  const [activeShelfView, setActiveShelfView] = useState<'shelf' | 'diseases' | 'matrices'>('shelf');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProjectStopOpen, setIsProjectStopOpen] = useState(false);

  // Domain & SubCategory Tree State
  const [selectedDomainId, setSelectedDomainId] = useState<string>('cat-1');
  const [selectedSubCatId, setSelectedSubCatId] = useState<string>('sub-1-1');
  const [sortOrder, setSortOrder] = useState<'SUBCATEGORY' | 'ALPHABETICAL' | 'SCHEDULE'>('SUBCATEGORY');

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

  // 3 Accordion Expand/Collapse States
  const [isSubcategoriesAccordionOpen, setIsSubcategoriesAccordionOpen] = useState<boolean>(true);
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
    searchQuery,
    searchDomainScope,
    searchSubCatScope,
    selectedDomainId,
    selectedSubCatId,
    sortOrder,
  ]);

  return (
    <div className="space-y-4">
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

        {/* 2. REAL-TIME SEARCH BAR & ADVANCED FILTERS TRIGGER (Active in Shelf View) */}
        {activeShelfView === 'shelf' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isFa
                    ? 'جستجوی آنی در نام برند، نام ژنریک، دوز، اندیکاسیون‌ها، کدهای PBS و نکات بالینی...'
                    : 'Real-time quick search across brand names, generics, indications, PBS codes & CAL labels...'
                }
                className="w-full pr-10 pl-4 py-2 rounded-xl border app-border bg-black/30 text-xs app-text focus:outline-none focus:border-teal-500 shadow-inner"
              />
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

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
          </div>
        )}
      </div>

      {/* VIEW 1: CLINICAL MATRICES & PROTOCOLS PANEL */}
      {activeShelfView === 'matrices' && (
        <ClinicalMatricesPanel
          language={language}
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

      {/* VIEW 3: MAIN PRODUCT SHELF (ONLY VISIBLE WHEN SHELF TAB IS ACTIVE) */}
      {activeShelfView === 'shelf' && (
        <>
          {/* 7 CLINICAL DOMAINS NAVIGATION & CATEGORY ARCHITECTURE */}
          <div className="space-y-4 my-2">
            <ShelfDomainSelector
              clinicalDomains={CLINICAL_DOMAINS}
              selectedDomainId={selectedDomainId}
              onSelectDomain={handleSelectDomain}
              language={language}
            />

            {/* 3 EXPANDABLE ACCORDIONS */}
            <div className="space-y-3">
              {/* ACCORDION 1: Subcategories & Clinical Pearls */}
              <ShelfSubcategoriesAccordion
                activeDomain={activeDomain}
                activeSubCat={activeSubCat}
                isOpen={isSubcategoriesAccordionOpen}
                onToggleOpen={() => setIsSubcategoriesAccordionOpen((prev) => !prev)}
                onSelectSubCatId={(id) => {
                  setSelectedSubCatId(id);
                }}
                onSelectDisease={setSelectedDisease}
                language={language}
              />

              {/* ACCORDION 2: Common Mechanism & Cellular Targets */}
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

              {/* ACCORDION 3: Grouping, Sorting & Schedule Matrix */}
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
            </div>
          </div>

          {/* PRODUCTS SECTION: SUBCATEGORY PRODUCTS GRID */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  {isFa
                    ? `داروهای زیرمجموعه «${activeSubCat.titleFa}» (${filteredProducts.length} محصول):`
                    : `Medicines in ${activeSubCat.titleEn} (${filteredProducts.length} products):`}
                </h3>
                {activeMechanismFilter !== 'ALL' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold flex items-center gap-1.5 animate-fadeIn">
                    <Dna className="w-3.5 h-3.5" />
                    <span>{activeMechanismFilter}</span>
                    <button
                      type="button"
                      onClick={() => setActiveMechanismFilter('ALL')}
                      className="hover:text-white ml-0.5 font-mono font-bold cursor-pointer"
                      title={isFa ? 'حذف فیلتر مکانیسم' : 'Clear mechanism filter'}
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupedByMechanism((prev) => !prev)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isGroupedByMechanism
                      ? 'bg-teal-500 text-slate-950 border-teal-400 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-teal-500/30'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isFa ? '🧬 گروه‌بندی بر اساس مکانیسم' : '🧬 Group by Mechanism'}</span>
                </button>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 pl-1">
                  <span>{isFa ? 'ترتیب:' : 'Sort:'}</span>
                  <span className="font-bold text-amber-300">
                    {sortOrder === 'SUBCATEGORY'
                      ? isFa ? 'بر اساس زیردسته‌ها' : 'By Subcategory'
                      : sortOrder === 'ALPHABETICAL'
                      ? isFa ? 'الفبایی' : 'Alphabetical'
                      : 'Schedule'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Mechanism Filter Chips */}
            {(() => {
              const availableMechanisms = Array.from(
                new Set(
                  SHELF_PRODUCTS.filter((p) => {
                    if (p.domainId && p.domainId !== selectedDomainId) return false;
                    if (selectedSubCatId && p.subcategoryId && p.subcategoryId !== selectedSubCatId) return false;
                    return true;
                  }).map((p) => {
                    const m = getProductMechanism(p);
                    return JSON.stringify({ code: m.classCode, nameFa: m.classNameFa, nameEn: m.classNameEn, action: m.actionClassification });
                  })
                )
              ).map((s) => JSON.parse(s));

              if (availableMechanisms.length <= 1) return null;

              return (
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-teal-500/20 text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px]">
                    <Dna className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{isFa ? 'فیلتر سریع مکانیسم:' : 'Quick Mechanism Filter:'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveMechanismFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                      activeMechanismFilter === 'ALL'
                        ? 'bg-teal-500 text-slate-950 border-teal-400 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {isFa ? 'همه مکانیسم‌ها' : 'All Mechanisms'}
                  </button>

                  {availableMechanisms.map((am) => {
                    const count = SHELF_PRODUCTS.filter((p) => {
                      if (p.domainId && p.domainId !== selectedDomainId) return false;
                      if (selectedSubCatId && p.subcategoryId && p.subcategoryId !== selectedSubCatId) return false;
                      return getProductMechanism(p).classCode === am.code;
                    }).length;

                    const isAct = activeMechanismFilter === am.code;

                    return (
                      <button
                        key={am.code}
                        type="button"
                        onClick={() => setActiveMechanismFilter(isAct ? 'ALL' : am.code)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          isAct
                            ? 'bg-teal-500 text-slate-950 border-teal-400 font-black shadow-xs'
                            : 'bg-teal-950/30 hover:bg-teal-900/40 text-teal-200 border-teal-500/30'
                        }`}
                      >
                        <span>{isFa ? am.nameFa : am.nameEn}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isAct ? 'bg-slate-900 text-teal-300' : 'bg-teal-500/20 text-teal-300'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* DRUG CARDS GRID (OR GROUPED BY MECHANISM) */}
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center app-card border app-border rounded-2xl text-slate-400 text-xs">
                {isFa
                  ? 'هیچ دارویی با فیلترهای انتخابی مطابقت ندارد. فیلترها را بازنشانی کنید.'
                  : 'No products match the selected criteria. Try resetting filters.'}
              </div>
            ) : isGroupedByMechanism ? (
              <div className="space-y-5 pt-2">
                {(() => {
                  const groupedMap = new Map<string, { mech: DrugMechanismInfo; prods: Product[] }>();
                  filteredProducts.forEach((p) => {
                    const m = getProductMechanism(p);
                    if (!groupedMap.has(m.classCode)) {
                      groupedMap.set(m.classCode, { mech: m, prods: [] });
                    }
                    groupedMap.get(m.classCode)!.prods.push(p);
                  });

                  return Array.from(groupedMap.values()).map(({ mech, prods }) => (
                    <div
                      key={mech.classCode}
                      className="p-4 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/20 via-slate-900/40 to-slate-950/40 space-y-3 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-500/20 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Dna className="w-4 h-4 text-teal-400" />
                          <h4 className="font-bold text-sm text-white">
                            {isFa ? mech.classNameFa : mech.classNameEn}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-mono font-bold">
                            {mech.actionClassification}
                          </span>
                        </div>
                        <span className="text-xs text-teal-300 font-mono font-bold">
                          {prods.length} {isFa ? 'دارو' : 'Medicines'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                        {prods.map((prod) => (
                          <ShelfDrugCard
                            key={prod.id}
                            prod={prod}
                            language={language}
                            calLabelsDict={CAL_LABELS_DICT}
                            onSelectSchedule={(sched) => setSelectedSchedule(sched as any)}
                            onSelectMechanism={setSelectedMechanismInfo}
                            onSelectCalInfo={setSelectedCalInfo}
                            onSelectConceptId={setSelectedConceptId}
                            onOpenAiLeitner={onOpenAiLeitner}
                            onNavigateToModule={onNavigateToModule}
                            onOpenProjectStop={() => {
                              setActiveProduct(prod);
                              setIsProjectStopOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-1">
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
                    onOpenAiLeitner={onOpenAiLeitner}
                    onNavigateToModule={onNavigateToModule}
                    onOpenProjectStop={() => {
                      setActiveProduct(prod);
                      setIsProjectStopOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* STATE STORAGE RULES COMPLIANCE TESTER */}
          <ShelfStateStorageTester
            selectedState={selectedState}
            onSelectState={setSelectedState}
            stateStorageRules={STATE_STORAGE_RULES}
            language={language}
          />
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
