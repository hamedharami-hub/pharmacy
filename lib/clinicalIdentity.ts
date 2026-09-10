import { DISEASES_REGISTRY, DiseaseInfo } from '@/data/diseasesRegistry';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';
import { Product } from '@/types/shelf';

export type ClinicalIdentityType = 'disease' | 'medicine' | 'product';

export interface MedicineIdentity {
  id: string;
  canonicalName: string;
  displayName: string;
  aliases: string[];
  productIds: string[];
}

export interface IdentityAlias {
  alias: string;
  normalizedAlias: string;
  entityId: string;
  type: ClinicalIdentityType;
  source: string;
}

export const normalizeIdentityText = (value: string) => value
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[®™]/g, '')
  .replace(/[()[\]{}]/g, ' ')
  .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const slugifyIdentity = (value: string) => normalizeIdentityText(value).replace(/\s+/g, '-');

// Keep formulation qualifiers when they change the medicine identity, but remove presentation strength noise.
export const canonicalMedicineName = (product: Product) => {
  const source = product.genericName || product.activeIngredients || product.brandName;
  return normalizeIdentityText(source)
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|%|iu|units?|mmol|micrograms?)\b/g, ' ')
    .replace(/\b(?:per|each)\s+[^ ]+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const medicineIdentityId = (product: Product) => `medicine:${slugifyIdentity(canonicalMedicineName(product))}`;
export const productIdentityId = (product: Product) => `product:${slugifyIdentity(product.id)}`;
export const diseaseIdentityId = (disease: Pick<DiseaseInfo, 'id'>) => `disease:${slugifyIdentity(disease.id)}`;

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const medicineMap = new Map<string, MedicineIdentity>();
for (const product of SHELF_PRODUCTS) {
  const id = medicineIdentityId(product);
  const existing = medicineMap.get(id);
  const productAliases = [product.genericName, product.activeIngredients, product.brandName, ...(product.equivalentBrands || [])];
  if (existing) {
    existing.productIds = unique([...existing.productIds, product.id]);
    existing.aliases = unique([...existing.aliases, ...productAliases]);
  } else {
    medicineMap.set(id, {
      id,
      canonicalName: canonicalMedicineName(product),
      displayName: product.genericName,
      aliases: unique(productAliases),
      productIds: [product.id],
    });
  }
}

export const MEDICINE_IDENTITIES: MedicineIdentity[] = Array.from(medicineMap.values());

export const CLINICAL_IDENTITY_ALIASES: IdentityAlias[] = [
  ...DISEASES_REGISTRY.flatMap((disease) => [disease.name.en, disease.name.fa, disease.id, ...disease.synonyms].map((alias) => ({
    alias,
    normalizedAlias: normalizeIdentityText(alias),
    entityId: diseaseIdentityId(disease),
    type: 'disease' as const,
    source: 'data/diseasesRegistry.ts',
  }))),
  ...SHELF_PRODUCTS.flatMap((product) => [product.id, product.brandName, product.genericName, product.activeIngredients, ...(product.equivalentBrands || [])].map((alias) => ({
    alias,
    normalizedAlias: normalizeIdentityText(alias),
    entityId: productIdentityId(product),
    type: 'product' as const,
    source: 'data/shelf/shelfProducts.ts',
  }))),
  ...MEDICINE_IDENTITIES.flatMap((medicine) => medicine.aliases.map((alias) => ({
    alias,
    normalizedAlias: normalizeIdentityText(alias),
    entityId: medicine.id,
    type: 'medicine' as const,
    source: 'canonical medicine identity',
  }))),
];

const aliasIndex = new Map<string, IdentityAlias[]>();
CLINICAL_IDENTITY_ALIASES.forEach((entry) => {
  const current = aliasIndex.get(entry.normalizedAlias) || [];
  if (!current.some((item) => item.entityId === entry.entityId)) current.push(entry);
  aliasIndex.set(entry.normalizedAlias, current);
});

export function resolveClinicalIdentity(alias: string, type?: ClinicalIdentityType) {
  return (aliasIndex.get(normalizeIdentityText(alias)) || []).filter((entry) => !type || entry.type === type);
}

export function getMedicineIdentity(id: string) {
  return MEDICINE_IDENTITIES.find((medicine) => medicine.id === id);
}

export function getProductMedicineId(product: Product) {
  return medicineIdentityId(product);
}

export function getIdentityStats() {
  return {
    diseases: new Set(DISEASES_REGISTRY.map(diseaseIdentityId)).size,
    medicines: MEDICINE_IDENTITIES.length,
    products: new Set(SHELF_PRODUCTS.map(productIdentityId)).size,
    aliases: CLINICAL_IDENTITY_ALIASES.length,
    duplicateProductSourceIds: SHELF_PRODUCTS.length - new Set(SHELF_PRODUCTS.map(productIdentityId)).size,
  };
}
