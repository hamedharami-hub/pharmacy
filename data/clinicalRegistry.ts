import { DISEASES_REGISTRY, DiseaseInfo } from '@/data/diseasesRegistry';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';
import { OTC_SCENARIOS, Scenario } from '@/data/otcScenarios';
import { CYP_ENZYMES_DATABASE } from '@/data/cypInteractionsData';
import { DRUG_MECHANISMS_REGISTRY } from '@/data/mechanismsRegistry';
import { CLINICAL_CONCEPTS_REGISTRY } from '@/data/shelf/clinicalConcepts';
import { getConceptsForProduct } from '@/data/shelf/diseaseHelpers';
import { ClinicalConcept, Product } from '@/types/shelf';
import {
  diseaseIdentityId,
  getProductMedicineId,
  MEDICINE_IDENTITIES,
  productIdentityId,
} from '@/lib/clinicalIdentity';
import { TRIAGE_CLINICAL_LINKS } from '@/lib/triageClinicalLinks';

export type ClinicalEntityType =
  | 'disease'
  | 'medicine'
  | 'product'
  | 'triage-scenario'
  | 'clinical-concept'
  | 'cyp-enzyme'
  | 'mechanism';

export type ClinicalRelationType =
  | 'used-for'
  | 'triages'
  | 'conversation-about'
  | 'explains'
  | 'interacts-with'
  | 'involves-medicine'
  | 'has-product'
  | 'has-medicine';

export type RelationConfidence = 'verified' | 'suggested';
export type LocalizedText = { fa: string; en: string };

export interface ClinicalEntity {
  id: string;
  type: ClinicalEntityType;
  title: LocalizedText;
  source: string;
  sourceId: string;
  category?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface ClinicalRelation {
  id: string;
  fromId: string;
  toId: string;
  type: ClinicalRelationType;
  confidence: RelationConfidence;
  source: string;
  reason?: string;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
const textOfDisease = (d: DiseaseInfo) => normalize([
  d.name.en, d.name.fa, ...d.synonyms,
  d.overview.en, d.overview.fa, d.treatment.otcOptions.en, d.treatment.otcOptions.fa,
].join(' '));
const textOfProduct = (p: Product) => normalize([
  p.brandName, p.genericName, p.activeIngredients, p.indications.en, p.indications.fa,
  ...p.counselingPoints.flatMap((point) => [point.en, point.fa]),
].join(' '));
const textOfScenario = (s: Scenario) => normalize([
  s.title.en, s.title.fa, s.category.en, s.category.fa,
  s.patientProfile.presentation.en, s.patientProfile.presentation.fa,
  ...s.redFlags.flatMap((flag) => [flag.en, flag.fa]),
  s.clinicalOutcome.recommendation.en, s.clinicalOutcome.recommendation.fa,
].join(' '));

const localized = (en: string, fa = en): LocalizedText => ({ en, fa });

export const CLINICAL_ENTITIES: ClinicalEntity[] = [
  ...DISEASES_REGISTRY.map((disease) => ({
    id: diseaseIdentityId(disease),
    type: 'disease' as const,
    title: disease.name,
    source: 'data/diseasesRegistry.ts',
    sourceId: disease.id,
    category: disease.categoryId,
    metadata: { hasOtcTreatment: Boolean(disease.treatment.otcOptions.en), hasShelfLinks: Boolean(disease.relatedShelfProducts?.length) },
  })),
  ...SHELF_PRODUCTS.map((product) => ({
    id: productIdentityId(product),
    type: 'product' as const,
    title: localized(product.brandName),
    source: 'data/shelf/shelfProducts.ts',
    sourceId: product.id,
    category: product.subcategoryId,
    metadata: { genericName: product.genericName, medicineId: getProductMedicineId(product), schedule: product.schedule },
  })),
  ...MEDICINE_IDENTITIES.map((medicine) => ({
    id: medicine.id,
    type: 'medicine' as const,
    title: { fa: medicine.displayName, en: medicine.displayName },
    source: 'lib/clinicalIdentity.ts',
    sourceId: medicine.id,
    metadata: { productCount: medicine.productIds.length, aliasCount: medicine.aliases.length },
  })),
  ...OTC_SCENARIOS.map((scenario) => ({
    id: `triage:${scenario.id}`,
    type: 'triage-scenario' as const,
    title: scenario.title,
    source: 'data/scenarios/index.ts',
    sourceId: scenario.id,
    category: scenario.category.en,
  })),
  ...Object.values(CLINICAL_CONCEPTS_REGISTRY).map((concept: ClinicalConcept) => ({
    id: `concept:${concept.id}`,
    type: 'clinical-concept' as const,
    title: localized(concept.titleEn, concept.titleFa),
    source: 'data/shelf/clinicalConcepts.ts',
    sourceId: concept.id,
    category: concept.categoryType,
  })),
  ...Object.values(CYP_ENZYMES_DATABASE).map((enzyme) => ({
    id: `cyp:${enzyme.id}`,
    type: 'cyp-enzyme' as const,
    title: localized(enzyme.titleEn, enzyme.titleFa),
    source: 'data/cypInteractionsData.ts',
    sourceId: enzyme.id,
  })),
  ...Object.entries(DRUG_MECHANISMS_REGISTRY).map(([key, mechanism]) => ({
    id: `mechanism:${key}`,
    type: 'mechanism' as const,
    title: localized(mechanism.classNameEn, mechanism.classNameFa),
    source: 'data/mechanismsRegistry.ts',
    sourceId: key,
    category: mechanism.actionClassification,
  })),
];

export const CLINICAL_ENTITIES_UNIQUE: ClinicalEntity[] = Array.from(
  new Map(CLINICAL_ENTITIES.map((entity) => [entity.id, entity])).values()
);
export const CLINICAL_ENTITY_BY_ID = new Map(CLINICAL_ENTITIES_UNIQUE.map((entity) => [entity.id, entity]));

const relations: ClinicalRelation[] = [];
const relationKeys = new Set<string>();
const addRelation = (relation: Omit<ClinicalRelation, 'id'>) => {
  const key = `${relation.fromId}|${relation.type}|${relation.toId}`;
  if (relationKeys.has(key)) return;
  relationKeys.add(key);
  relations.push({ ...relation, id: `relation:${relations.length + 1}` });
};

// Explicit disease -> Shelf product links are treated as verified source data.
DISEASES_REGISTRY.forEach((disease) => {
  (disease.relatedShelfProducts || []).forEach((productId) => {
    if (CLINICAL_ENTITY_BY_ID.has(`product:${productId}`)) {
      addRelation({ fromId: diseaseIdentityId(disease), toId: productIdentityId({ id: productId } as Product), type: 'has-product', confidence: 'verified', source: 'DiseaseInfo.relatedShelfProducts' });
    }
  });
});

// Product text and existing product concepts create reviewable suggestions, never silent clinical facts.
SHELF_PRODUCTS.forEach((product) => {
  const productText = textOfProduct(product);
  DISEASES_REGISTRY.forEach((disease) => {
    const terms = [disease.id.replace(/^(otc|dis)-/, '').replaceAll('_', ' '), ...disease.synonyms.map(normalize)].filter((term) => term.length >= 4);
    if (terms.some((term) => productText.includes(term))) {
      addRelation({ fromId: productIdentityId(product), toId: diseaseIdentityId(disease), type: 'used-for', confidence: 'suggested', source: 'product indications and disease names', reason: 'Normalized term match; requires clinical review.' });
    }
  });
  getConceptsForProduct(product).forEach((concept) => addRelation({
    fromId: productIdentityId(product), toId: `concept:${concept.id}`, type: 'explains', confidence: 'suggested', source: 'getConceptsForProduct', reason: 'Explicit conceptIds or keyword detection.'
  }));
});

// Canonical Triage links are reviewable suggestions until a pharmacist accepts them.
TRIAGE_CLINICAL_LINKS.forEach((link) => addRelation({
  fromId: `triage:${link.scenarioId}`,
  toId: link.targetId,
  type: link.targetType === 'disease' ? 'triages' : 'involves-medicine',
  confidence: link.confidence,
  source: `triageClinicalLinks:${link.source}`,
  reason: link.reason,
}));

// A product's detected mechanism is a navigational link to the mechanism popup.
SHELF_PRODUCTS.forEach((product) => {
  const mechanism = product.mechanism;
  if (!mechanism) return;
  const mechanismKey = Object.entries(DRUG_MECHANISMS_REGISTRY).find(([, value]) => value.classCode === mechanism.classCode)?.[0];
  if (mechanismKey) addRelation({ fromId: productIdentityId(product), toId: `mechanism:${mechanismKey}`, type: 'explains', confidence: 'verified', source: 'Product.mechanism.classCode' });
});

SHELF_PRODUCTS.forEach((product) => addRelation({
  fromId: productIdentityId(product),
  toId: getProductMedicineId(product),
  type: 'has-medicine',
  confidence: 'verified',
  source: 'Product.genericName canonical identity',
}));

export const CLINICAL_RELATIONS = relations;
export const CLINICAL_RELATIONS_BY_FROM = new Map<string, ClinicalRelation[]>();
export const CLINICAL_RELATIONS_BY_TO = new Map<string, ClinicalRelation[]>();
CLINICAL_RELATIONS.forEach((relation) => {
  const from = CLINICAL_RELATIONS_BY_FROM.get(relation.fromId) || [];
  from.push(relation);
  CLINICAL_RELATIONS_BY_FROM.set(relation.fromId, from);
  const to = CLINICAL_RELATIONS_BY_TO.get(relation.toId) || [];
  to.push(relation);
  CLINICAL_RELATIONS_BY_TO.set(relation.toId, to);
});

export function getClinicalEntity(id: string) {
  return CLINICAL_ENTITY_BY_ID.get(id);
}

export function getClinicalRelations(entityId: string, type?: ClinicalRelationType) {
  return [...(CLINICAL_RELATIONS_BY_FROM.get(entityId) || []), ...(CLINICAL_RELATIONS_BY_TO.get(entityId) || [])]
    .filter((relation) => !type || relation.type === type);
}

export function getRelatedClinicalEntities(entityId: string, type?: ClinicalRelationType) {
  return getClinicalRelations(entityId, type)
    .map((relation) => relation.fromId === entityId ? relation.toId : relation.fromId)
    .map((id) => getClinicalEntity(id))
    .filter((entity): entity is ClinicalEntity => Boolean(entity));
}

export function getClinicalRegistryStats() {
  const byType = CLINICAL_ENTITIES_UNIQUE.reduce<Record<string, number>>((stats, entity) => {
    stats[entity.type] = (stats[entity.type] || 0) + 1;
    return stats;
  }, {});
  const byConfidence = CLINICAL_RELATIONS.reduce<Record<string, number>>((stats, relation) => {
    stats[relation.confidence] = (stats[relation.confidence] || 0) + 1;
    return stats;
  }, {});
  return { entityCount: CLINICAL_ENTITIES_UNIQUE.length, relationCount: CLINICAL_RELATIONS.length, byType, byConfidence };
}
