import { describe, expect, it } from 'vitest';
import { searchClinicalEntities } from '@/lib/clinicalSearch';

describe('central clinical search', () => {
  it('finds canonical medicines by generic or brand text', () => {
    const results = searchClinicalEntities('Panadol');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.type === 'medicine' || result.type === 'product')).toBe(true);
  });

  it('finds bilingual disease and triage entities', () => {
    const diseaseResults = searchClinicalEntities('heartburn');
    expect(diseaseResults.some((result) => result.type === 'disease' || result.type === 'triage-scenario')).toBe(true);
  });

  it('searches CYP and mechanism entities through canonical metadata', () => {
    expect(searchClinicalEntities('CYP3A4').some((result) => result.type === 'cyp-enzyme')).toBe(true);
    expect(searchClinicalEntities('fungistatic').some((result) => result.type === 'mechanism')).toBe(true);
  });

  it('returns no results for an unknown query and honors the limit', () => {
    expect(searchClinicalEntities('zz-no-clinical-match-zz')).toEqual([]);
    expect(searchClinicalEntities('a', 3).length).toBeLessThanOrEqual(3);
  });
});
