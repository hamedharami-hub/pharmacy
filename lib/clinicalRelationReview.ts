import { ClinicalRelation, CLINICAL_RELATIONS } from '@/data/clinicalRegistry';

export type ClinicalRelationReviewStatus = 'accepted' | 'rejected';
export type ClinicalRelationReviewMap = Record<string, ClinicalRelationReviewStatus>;

const STORAGE_KEY = 'pharmacy:clinical-relation-reviews:v1';
const EVENT_NAME = 'clinical-relation-review-updated';

export function getClinicalRelationReviews(): ClinicalRelationReviewMap {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveClinicalRelationReview(relationId: string, status: ClinicalRelationReviewStatus) {
  if (typeof window === 'undefined') return;
  const next = { ...getClinicalRelationReviews(), [relationId]: status };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
}

export function clearClinicalRelationReview(relationId: string) {
  if (typeof window === 'undefined') return;
  const next = getClinicalRelationReviews();
  delete next[relationId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
}

export function getSuggestedClinicalRelations(): ClinicalRelation[] {
  return CLINICAL_RELATIONS.filter((relation) => relation.confidence === 'suggested');
}

export function getClinicalRelationReviewEventName() {
  return EVENT_NAME;
}
