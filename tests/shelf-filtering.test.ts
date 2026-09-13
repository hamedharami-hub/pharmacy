import { describe, expect, it } from 'vitest';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';
import { CLINICAL_DOMAINS } from '@/data/shelf/clinicalDomains';

describe('Shelf Domain & Subcategory Filtering Integrity', () => {
  it('correctly maps every shelf product to a valid clinical domain using categoryId or domainId', () => {
    const validDomainIds = new Set(CLINICAL_DOMAINS.map((d) => d.id));

    SHELF_PRODUCTS.forEach((prod) => {
      const prodDomain = prod.domainId || prod.categoryId;
      expect(prodDomain).toBeDefined();
      expect(validDomainIds.has(prodDomain!)).toBe(true);
    });
  });

  it('filters products by specific domains accurately', () => {
    CLINICAL_DOMAINS.forEach((domain) => {
      const domainProducts = SHELF_PRODUCTS.filter(
        (p) => (p.domainId || p.categoryId) === domain.id
      );

      // Verify each domain contains products
      expect(domainProducts.length).toBeGreaterThan(0);

      // Verify all products in the filtered subset belong to the targeted domain
      domainProducts.forEach((p) => {
        expect(p.domainId || p.categoryId).toBe(domain.id);
      });
    });
  });

  it('ensures subcategory filtering functions within the selected domain', () => {
    const cat1 = CLINICAL_DOMAINS.find((d) => d.id === 'cat-1');
    expect(cat1).toBeDefined();

    const sub1 = cat1?.subcategories[0];
    expect(sub1).toBeDefined();

    const filtered = SHELF_PRODUCTS.filter(
      (p) =>
        (p.domainId || p.categoryId) === 'cat-1' &&
        p.subcategoryId === sub1?.id
    );

    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((p) => {
      expect(p.subcategoryId).toBe(sub1?.id);
    });
  });
});
