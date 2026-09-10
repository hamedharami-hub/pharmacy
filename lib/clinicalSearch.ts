import {
  CLINICAL_ENTITIES_UNIQUE,
  ClinicalEntity,
  ClinicalEntityType,
} from '@/data/clinicalRegistry';

export interface ClinicalSearchResult extends ClinicalEntity {
  matchedOn: 'title' | 'category' | 'metadata';
  score: number;
}

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
const searchableText = (entity: ClinicalEntity) => normalize([
  entity.id,
  entity.title.fa,
  entity.title.en,
  entity.category || '',
  ...Object.values(entity.metadata || {}).map(String),
].join(' '));

const typeWeight: Record<ClinicalEntityType, number> = {
  disease: 8,
  medicine: 9,
  product: 8,
  'triage-scenario': 7,
  'clinical-concept': 6,
  'cyp-enzyme': 5,
  mechanism: 5,
};

export function searchClinicalEntities(query: string, limit = 20): ClinicalSearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return CLINICAL_ENTITIES_UNIQUE.map((entity) => {
    const title = normalize(`${entity.title.fa} ${entity.title.en}`);
    const category = normalize(entity.category || '');
    const body = searchableText(entity);
    const titleMatch = terms.every((term) => title.includes(term));
    const categoryMatch = terms.every((term) => category.includes(term));
    const bodyMatch = terms.every((term) => body.includes(term));
    if (!titleMatch && !categoryMatch && !bodyMatch) return null;
    const score = (titleMatch ? 100 : 0) + (categoryMatch ? 25 : 0) + (bodyMatch ? 10 : 0) + typeWeight[entity.type];
    return { ...entity, matchedOn: titleMatch ? 'title' : categoryMatch ? 'category' : 'metadata', score };
  }).filter((result): result is ClinicalSearchResult => Boolean(result)).sort((a, b) => b.score - a.score || a.title.en.localeCompare(b.title.en)).slice(0, limit);
}
