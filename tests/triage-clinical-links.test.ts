import { describe, expect, it } from 'vitest';
import { getClinicalEntity } from '@/data/clinicalRegistry';
import { getTriageClinicalLinks, getTriageLinkStats, TRIAGE_CLINICAL_LINKS } from '@/lib/triageClinicalLinks';
import { OTC_SCENARIOS } from '@/data/otcScenarios';

describe('canonical Triage clinical links', () => {
  it('creates reviewable links for more than one triage scenario', () => {
    const stats = getTriageLinkStats();
    expect(stats.scenariosWithLinks).toBeGreaterThan(1);
    expect(stats.diseaseLinks).toBeGreaterThan(0);
    expect(stats.medicineLinks).toBeGreaterThan(0);
  });

  it('keeps every link suggested and points to a canonical entity', () => {
    expect(TRIAGE_CLINICAL_LINKS.every((link) => link.confidence === 'suggested')).toBe(true);
    expect(TRIAGE_CLINICAL_LINKS.every((link) => Boolean(getClinicalEntity(link.targetId)) || link.targetId.startsWith('medicine:'))).toBe(true);
    expect(TRIAGE_CLINICAL_LINKS.every((link) => link.reason.includes('canonical alias'))).toBe(true);
  });

  it('returns only links for the requested scenario and target type', () => {
    const scenarioId = OTC_SCENARIOS[0].id;
    const diseaseLinks = getTriageClinicalLinks(scenarioId, 'disease');
    expect(diseaseLinks.every((link) => link.scenarioId === scenarioId && link.targetType === 'disease')).toBe(true);
  });
});
