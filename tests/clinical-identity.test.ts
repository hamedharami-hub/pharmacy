import { describe, expect, it } from 'vitest';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';
import {
  getIdentityStats,
  getProductMedicineId,
  MEDICINE_IDENTITIES,
  resolveClinicalIdentity,
  slugifyIdentity,
} from '@/lib/clinicalIdentity';

describe('clinical canonical identities', () => {
  it('creates stable slug and separate product/medicine identity namespaces', () => {
    expect(slugifyIdentity('Panadol 500mg')).toBe('panadol-500mg');
    const product = SHELF_PRODUCTS.find((item) => item.id === 'prod-panadol-500');
    expect(product).toBeTruthy();
    expect(getProductMedicineId(product!)).toMatch(/^medicine:/);
    expect(getProductMedicineId(product!)).not.toBe(`product:${product!.id}`);
  });

  it('merges products sharing a generic medicine identity while preserving product ids', () => {
    const levothyroxine = MEDICINE_IDENTITIES.find((medicine) => medicine.canonicalName.includes('levothyroxine'));
    expect(levothyroxine).toBeTruthy();
    expect(levothyroxine!.productIds).toEqual(expect.arrayContaining(['prod-eutroxsig-100mcg', 'prod-oroxine-100mcg']));
  });

  it('resolves a brand and generic alias to product or medicine identities', () => {
    const brandMatches = resolveClinicalIdentity('Panadol 500mg', 'product');
    const genericMatches = resolveClinicalIdentity('Paracetamol', 'medicine');
    expect(brandMatches.some((match) => match.entityId === 'product:prod-panadol-500')).toBe(true);
    expect(genericMatches.some((match) => match.entityId.startsWith('medicine:'))).toBe(true);
  });

  it('reports duplicate source products without collapsing their study records', () => {
    const stats = getIdentityStats();
    expect(stats.products).toBeGreaterThan(0);
    expect(stats.medicines).toBeGreaterThan(0);
    expect(stats.duplicateProductSourceIds).toBe(2);
  });
});
