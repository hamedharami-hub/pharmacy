import { describe, expect, it } from 'vitest';
import { getClinicalEntity, getClinicalRelations } from '@/data/clinicalRegistry';
import { getKnowledgeClinicalLinks, getKnowledgeLinkStats, KNOWLEDGE_CLINICAL_LINKS } from '@/lib/knowledgeClinicalLinks';

describe('canonical knowledge clinical links', () => {
  it('creates CYP, mechanism and concept link groups', () => {
    const stats = getKnowledgeLinkStats();
    expect(stats.cypLinks).toBeGreaterThan(0);
    expect(stats.mechanismLinks).toBeGreaterThan(0);
    expect(stats.conceptLinks).toBeGreaterThan(0);
  });

  it('keeps relation endpoints inside the canonical registry', () => {
    expect(KNOWLEDGE_CLINICAL_LINKS.every((link) => getClinicalEntity(link.fromId) && getClinicalEntity(link.toId))).toBe(true);
  });

  it('exposes navigable relations for a CYP entity and a mechanism entity', () => {
    const cypRelations = getKnowledgeClinicalLinks('cyp:CYP3A4');
    expect(cypRelations.length).toBeGreaterThan(0);
    expect(getClinicalRelations('cyp:CYP3A4').length).toBeGreaterThan(0);
    const mechanism = KNOWLEDGE_CLINICAL_LINKS.find((link) => link.toId.startsWith('mechanism:'));
    expect(mechanism).toBeTruthy();
    expect(getKnowledgeClinicalLinks(mechanism!.toId).length).toBeGreaterThan(0);
  });

  it('does not silently verify text-derived concept or CYP matches', () => {
    expect(KNOWLEDGE_CLINICAL_LINKS.filter((link) => link.source !== 'Product.mechanism.classCode').every((link) => link.confidence === 'suggested')).toBe(true);
  });
});
