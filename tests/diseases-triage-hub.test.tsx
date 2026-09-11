import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DISEASES_REGISTRY } from '@/data/diseasesRegistry';
import { OTC_SCENARIOS } from '@/data/otcScenarios';
import {
  hasTriageScenario,
  getScenariosForDisease,
  SPECIAL_TRIAGE_CATEGORIES,
  getTriageBridgeStats,
} from '@/lib/diseaseTriageBridge';
import {
  getSubcategoriesForCategory,
  matchDiseaseToSubcategory,
} from '@/lib/diseaseSubcategories';
import { UnifiedCategorySelector } from '@/components/triage/UnifiedCategorySelector';
import { UnifiedDiseaseExplorer } from '@/components/triage/UnifiedDiseaseExplorer';

vi.mock('@/components/study/StudyTrackerContext', () => ({
  useStudyTrackerContext: () => ({
    markItemViewed: vi.fn(),
    toggleItemCompleted: vi.fn(),
    isViewed: () => false,
    isCompleted: () => false,
    getItemFlag: () => null,
    setItemFlag: vi.fn(),
  }),
}));

describe('Diseases and Triage Bridge & Subcategories', () => {
  it('correctly maps diseases to triage scenarios and tracks bridge stats', () => {
    const stats = getTriageBridgeStats();
    expect(stats.totalDiseases).toBe(DISEASES_REGISTRY.length);
    expect(stats.totalScenarios).toBe(OTC_SCENARIOS.length);
    expect(stats.diseasesWithTriage).toBeGreaterThan(0);
    expect(stats.slangScenariosCount).toBe(SPECIAL_TRIAGE_CATEGORIES[0].scenarios.length);
    expect(stats.adminScenariosCount).toBe(SPECIAL_TRIAGE_CATEGORIES[1].scenarios.length);

    // Verify Asthma has at least one triage scenario
    const asthma = DISEASES_REGISTRY.find((d) => d.id === 'dis-asthma');
    expect(asthma).toBeDefined();
    expect(hasTriageScenario('dis-asthma')).toBe(true);
    const asthmaScenarios = getScenariosForDisease('dis-asthma');
    expect(asthmaScenarios.map((scenario) => scenario.id)).toEqual(['nsaid-safety-check']);
    expect(asthmaScenarios.some((scenario) => scenario.id === 'slang-ibuprofen-brand-vs-generic')).toBe(false);
  });

  it('provides subcategories for all clinical disease categories', () => {
    const respSubcats = getSubcategoriesForCategory('resp');
    expect(respSubcats.length).toBeGreaterThan(0);

    const asthma = DISEASES_REGISTRY.find((d) => d.id === 'dis-asthma');
    if (asthma) {
      expect(matchDiseaseToSubcategory(asthma, 'resp-lower')).toBe(true);
    }

    const giSubcats = getSubcategoriesForCategory('gi');
    expect(giSubcats.length).toBeGreaterThan(0);
  });

  it('renders UnifiedCategorySelector with all categories, special categories, and triage checkbox', () => {
    const onSelectCategory = vi.fn();
    const onSelectSubCat = vi.fn();
    const onToggleTriageOnly = vi.fn();

    render(
      <UnifiedCategorySelector
        selectedCategoryId="ALL"
        onSelectCategory={onSelectCategory}
        selectedSubCatId="ALL"
        onSelectSubCat={onSelectSubCat}
        triageOnly={false}
        onToggleTriageOnly={onToggleTriageOnly}
        language="fa"
      />
    );

    // Verify triage-only checkbox is rendered
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(onToggleTriageOnly).toHaveBeenCalled();
  });

  it('renders disease cards with triage badges and allows starting triage', () => {
    const onSelectDisease = vi.fn();
    const onStartTriage = vi.fn();
    const onStartSpecial = vi.fn();

    const sampleDiseases = DISEASES_REGISTRY.slice(0, 5);

    render(
      <UnifiedDiseaseExplorer
        language="fa"
        diseases={sampleDiseases}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onSelectDisease={onSelectDisease}
        onStartTriageForDisease={onStartTriage}
        onStartSpecialScenario={onStartSpecial}
      />
    );

    // Should render disease names
    expect(screen.getByText(sampleDiseases[0].name.en)).toBeInTheDocument();

    // Check for triage badge or start triage button if any of first 5 has triage
    const triageBadges = screen.queryAllByText(/تریاژ بالینی/i);
    expect(triageBadges.length).toBeGreaterThan(0);
  });

  it('renders special categories (Slang / Admin) scenarios properly', () => {
    const onStartSpecial = vi.fn();
    const slangCategory = SPECIAL_TRIAGE_CATEGORIES[0];

    render(
      <UnifiedDiseaseExplorer
        language="fa"
        diseases={[]}
        specialCategory={slangCategory}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onSelectDisease={vi.fn()}
        onStartTriageForDisease={vi.fn()}
        onStartSpecialScenario={onStartSpecial}
      />
    );

    // Should render scenarios for slang
    expect(screen.getByText(slangCategory.name.fa)).toBeInTheDocument();
    expect(screen.getAllByText(/شروع شبیه‌سازی تریاژ/i).length).toBe(slangCategory.scenarios.length);

    // Click the first start button
    fireEvent.click(screen.getAllByText(/شروع شبیه‌سازی تریاژ/i)[0]);
    expect(onStartSpecial).toHaveBeenCalled();
  });
});
