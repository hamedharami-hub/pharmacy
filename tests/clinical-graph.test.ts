import { describe, expect, it } from 'vitest';
import { getClinicalEntity, getClinicalRelations } from '@/data/clinicalRegistry';

describe('clinical relationship graph', () => {
  it('has navigable two-way relations for a canonical disease', () => {
    const disease = getClinicalEntity('disease:otc-gord-heartburn') || getClinicalEntity('disease:otc-gord_heartburn');
    expect(disease).toBeTruthy();
    const relations = getClinicalRelations(disease!.id);
    expect(relations.length).toBeGreaterThan(0);
    for (const relation of relations) {
      const otherId = relation.fromId === disease!.id ? relation.toId : relation.fromId;
      expect(getClinicalEntity(otherId)).toBeTruthy();
    }
  });

  it('keeps graph relation keys unique', () => {
    const relations = getClinicalRelations('cyp:CYP3A4');
    expect(new Set(relations.map((relation) => relation.id)).size).toBe(relations.length);
  });
});
