import { CYP_ENZYMES_DATABASE, COMMON_PAIR_INTERACTIONS, CypDrugEntry } from '@/data/cypInteractionsData';
import { CLINICAL_CONCEPTS_REGISTRY } from '@/data/shelf/clinicalConcepts';
import { DRUG_MECHANISMS_REGISTRY } from '@/data/mechanismsRegistry';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';
import { getProductMedicineId, MEDICINE_IDENTITIES, normalizeIdentityText } from '@/lib/clinicalIdentity';

export type KnowledgeLinkType = 'cyp-enzyme' | 'mechanism' | 'clinical-concept';
export interface KnowledgeClinicalLink {
  fromId: string;
  toId: string;
  type: 'interacts-with' | 'explains' | 'has-medicine';
  source: string;
  confidence: 'verified' | 'suggested';
  reason: string;
}

const contains = (text: string, alias: string) => {
  const a = normalizeIdentityText(alias);
  return a.length >= 4 && normalizeIdentityText(text).includes(a);
};

const medicineByAlias = (value: string) => MEDICINE_IDENTITIES.filter((medicine) => medicine.aliases.some((alias) => contains(value, alias)));
const links: KnowledgeClinicalLink[] = [];
const keys = new Set<string>();
const add = (link: KnowledgeClinicalLink) => {
  const key = `${link.fromId}|${link.type}|${link.toId}`;
  if (!keys.has(key)) { keys.add(key); links.push(link); }
};

// CYP profile entries and pair interactions become reviewable links to canonical medicines.
Object.values(CYP_ENZYMES_DATABASE).forEach((enzyme) => {
  const entries: CypDrugEntry[] = [...enzyme.inhibitors, ...enzyme.inducers, ...enzyme.substrates];
  entries.forEach((entry) => medicineByAlias(`${entry.name} ${entry.nameFa || ''}`).forEach((medicine) => add({
    fromId: `cyp:${enzyme.id}`,
    toId: medicine.id,
    type: 'interacts-with',
    source: 'CYP_ENZYMES_DATABASE',
    confidence: 'suggested',
    reason: `CYP profile entry matched canonical medicine alias "${medicine.displayName}"; requires clinical review.`,
  })));
});

COMMON_PAIR_INTERACTIONS.forEach((pair) => {
  const enzymes = [`cyp:${pair.enzyme}`];
  [...medicineByAlias(pair.drugA), ...medicineByAlias(pair.drugB)].forEach((medicine) => enzymes.forEach((enzymeId) => add({
    fromId: enzymeId,
    toId: medicine.id,
    type: 'interacts-with',
    source: 'COMMON_PAIR_INTERACTIONS',
    confidence: 'suggested',
    reason: `Pair interaction ${pair.drugA} / ${pair.drugB} matched a canonical medicine; requires clinical review.`,
  })));
});

// Map canonical medicines to mechanism entries using mechanism text and product evidence.
Object.entries(DRUG_MECHANISMS_REGISTRY).forEach(([key, mechanism]) => {
  const mechanismText = `${mechanism.classNameEn} ${mechanism.classNameFa} ${mechanism.descriptionEn} ${mechanism.descriptionFa} ${mechanism.clinicalRelevanceEn}`;
  MEDICINE_IDENTITIES.forEach((medicine) => {
    if (medicine.aliases.some((alias) => contains(mechanismText, alias))) add({
      fromId: medicine.id,
      toId: `mechanism:${key}`,
      type: 'explains',
      source: 'mechanism registry text and canonical medicine aliases',
      confidence: 'suggested',
      reason: `Mechanism text matched canonical medicine alias "${medicine.displayName}"; requires clinical review.`,
    });
  });
});

// Preserve any explicit product mechanism links and expose them at the canonical medicine level too.
SHELF_PRODUCTS.forEach((product) => {
  if (!product.mechanism) return;
  const mechanism = Object.entries(DRUG_MECHANISMS_REGISTRY).find(([, value]) => value.classCode === product.mechanism?.classCode);
  if (!mechanism) return;
  add({ fromId: getProductMedicineId(product), toId: `mechanism:${mechanism[0]}`, type: 'explains', source: 'Product.mechanism.classCode', confidence: 'verified', reason: 'Product mechanism explicitly maps to the registered mechanism.' });
});

// Clinical concepts are educational nodes. Keyword matches remain suggestions; explicit conceptIds are verified elsewhere.
Object.entries(CLINICAL_CONCEPTS_REGISTRY).forEach(([conceptId, concept]) => {
  const conceptText = `${concept.titleEn} ${concept.titleFa} ${concept.descriptionEn} ${concept.descriptionFa}`;
  Object.values(CYP_ENZYMES_DATABASE).forEach((enzyme) => {
    if (contains(conceptText, enzyme.id) || contains(conceptText, enzyme.name)) add({
      fromId: `concept:${conceptId}`,
      toId: `cyp:${enzyme.id}`,
      type: 'explains',
      source: 'clinical concept CYP reference',
      confidence: 'suggested',
      reason: `Concept text references ${enzyme.id}; requires clinical review.`,
    });
  });
  MEDICINE_IDENTITIES.forEach((medicine) => {
    if (medicine.aliases.some((alias) => contains(conceptText, alias))) add({
      fromId: `concept:${conceptId}`,
      toId: medicine.id,
      type: 'explains',
      source: 'clinical concept text and canonical medicine aliases',
      confidence: 'suggested',
      reason: `Concept text matched canonical medicine alias "${medicine.displayName}"; requires clinical review.`,
    });
  });
});

export const KNOWLEDGE_CLINICAL_LINKS = links;
export function getKnowledgeClinicalLinks(entityId: string) { return links.filter((link) => link.fromId === entityId || link.toId === entityId); }
export function getKnowledgeLinkStats() {
  return {
    total: links.length,
    cypLinks: links.filter((link) => link.fromId.startsWith('cyp:')).length,
    mechanismLinks: links.filter((link) => link.toId.startsWith('mechanism:')).length,
    conceptLinks: links.filter((link) => link.fromId.startsWith('concept:')).length,
  };
}
