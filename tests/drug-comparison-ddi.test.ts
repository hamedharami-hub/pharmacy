import { describe, expect, it } from 'vitest';
import { COMMON_PAIR_INTERACTIONS } from '@/data/cypInteractionsData';

describe('Drug Comparison DDI & CYP Interaction Engine', () => {
  it('contains critical clinical drug interactions for high-risk Australian medicines', () => {
    expect(COMMON_PAIR_INTERACTIONS.length).toBeGreaterThanOrEqual(9);

    const statinMacrolide = COMMON_PAIR_INTERACTIONS.find(
      (p) =>
        (p.drugA === 'Simvastatin' && p.drugB === 'Clarithromycin') ||
        (p.drugA === 'Clarithromycin' && p.drugB === 'Simvastatin')
    );
    expect(statinMacrolide).toBeDefined();
    expect(statinMacrolide?.severity).toBe('critical');

    const warfarinFluconazole = COMMON_PAIR_INTERACTIONS.find(
      (p) =>
        (p.drugA === 'Warfarin' && p.drugB === 'Fluconazole') ||
        (p.drugA === 'Fluconazole' && p.drugB === 'Warfarin')
    );
    expect(warfarinFluconazole).toBeDefined();
    expect(warfarinFluconazole?.severity).toBe('critical');
  });

  it('correctly matches pairwise interactions between drug strings', () => {
    const drug1 = 'Simvastatin 40mg (Zocor)';
    const drug2 = 'Clarithromycin 500mg (Klacid)';

    const names1 = drug1.toLowerCase();
    const names2 = drug2.toLowerCase();

    const matched = COMMON_PAIR_INTERACTIONS.filter((pair) => {
      const dA = pair.drugA.toLowerCase();
      const dB = pair.drugB.toLowerCase();
      return (
        (names1.includes(dA) && names2.includes(dB)) ||
        (names1.includes(dB) && names2.includes(dA))
      );
    });

    expect(matched.length).toBeGreaterThan(0);
    expect(matched[0].severity).toBe('critical');
  });
});
