import { describe, expect, it } from 'vitest';
import {
  CLINICAL_ENTITIES,
  CLINICAL_ENTITIES_UNIQUE,
  CLINICAL_RELATIONS,
  getClinicalEntity,
  getClinicalRegistryStats,
  getRelatedClinicalEntities,
} from '@/data/clinicalRegistry';

describe('central clinical registry', () => {
  it('registers diseases, products, triage, concepts, CYP and mechanisms', () => {
    const stats = getClinicalRegistryStats();
    expect(stats.byType.disease).toBeGreaterThan(0);
    expect(stats.byType.product).toBeGreaterThan(0);
    expect(stats.byType['triage-scenario']).toBeGreaterThan(0);
    expect(stats.byType['clinical-concept']).toBeGreaterThan(0);
    expect(stats.byType['cyp-enzyme']).toBeGreaterThan(0);
    expect(stats.byType.mechanism).toBeGreaterThan(0);
    expect(CLINICAL_ENTITIES_UNIQUE.length).toBe(stats.entityCount);
    expect(new Set(CLINICAL_ENTITIES_UNIQUE.map((entity) => entity.id)).size).toBe(CLINICAL_ENTITIES_UNIQUE.length);
  });

  it('keeps relation identifiers unique and separates verified from suggested links', () => {
    const ids = CLINICAL_RELATIONS.map((relation) => relation.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CLINICAL_RELATIONS.some((relation) => relation.confidence === 'verified')).toBe(true);
    expect(CLINICAL_RELATIONS.some((relation) => relation.confidence === 'suggested')).toBe(true);
  });

  it('resolves a product entity and returns navigable related concepts', () => {
    const product = getClinicalEntity('product:prod-panadol-500');
    expect(product?.type).toBe('product');
    expect(getRelatedClinicalEntities('product:prod-panadol-500').every(Boolean)).toBe(true);
  });

  it('does not create relation endpoints that are absent from the entity registry', () => {
    for (const relation of CLINICAL_RELATIONS) {
      expect(getClinicalEntity(relation.fromId)).toBeTruthy();
      expect(getClinicalEntity(relation.toId)).toBeTruthy();
    }
  });
});
