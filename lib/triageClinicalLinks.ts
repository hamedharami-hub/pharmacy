import { DISEASES_REGISTRY, DiseaseInfo } from '@/data/diseasesRegistry';
import { OTC_SCENARIOS, Scenario } from '@/data/otcScenarios';
import { diseaseIdentityId, MEDICINE_IDENTITIES, normalizeIdentityText } from '@/lib/clinicalIdentity';

export type TriageLinkTargetType = 'disease' | 'medicine';

export interface TriageClinicalLink {
  scenarioId: string;
  targetId: string;
  targetType: TriageLinkTargetType;
  confidence: 'suggested';
  matchedAlias: string;
  source: 'scenario title' | 'patient presentation' | 'clinical outcome' | 'scenario text';
  reason: string;
}

const textParts = (scenario: Scenario) => [
  { text: scenario.title.en, source: 'scenario title' as const },
  { text: scenario.title.fa, source: 'scenario title' as const },
  { text: scenario.category.en, source: 'scenario text' as const },
  { text: scenario.category.fa, source: 'scenario text' as const },
  { text: scenario.patientProfile.presentation.en, source: 'patient presentation' as const },
  { text: scenario.patientProfile.presentation.fa, source: 'patient presentation' as const },
  { text: scenario.clinicalOutcome.recommendation.en, source: 'clinical outcome' as const },
  { text: scenario.clinicalOutcome.recommendation.fa, source: 'clinical outcome' as const },
  ...scenario.redFlags.flatMap((flag) => [
    { text: flag.en, source: 'scenario text' as const },
    { text: flag.fa, source: 'scenario text' as const },
  ]),
  ...scenario.whatQuestions.flatMap((question) => [
    { text: question.question.en, source: 'scenario text' as const },
    { text: question.question.fa, source: 'scenario text' as const },
    { text: question.answer.en, source: 'scenario text' as const },
    { text: question.answer.fa, source: 'scenario text' as const },
  ]),
  ...scenario.dialogueOptions.flatMap((option) => [
    { text: option.text.en, source: 'scenario text' as const },
    { text: option.text.fa, source: 'scenario text' as const },
    { text: option.patientReply.en, source: 'scenario text' as const },
    { text: option.patientReply.fa, source: 'scenario text' as const },
  ]),
];

const matchesAlias = (normalizedText: string, alias: string) => {
  const normalizedAlias = normalizeIdentityText(alias);
  if (normalizedAlias.length < 5) return false;
  return normalizedText.includes(normalizedAlias);
};

const diseaseAliases = (disease: DiseaseInfo) => [
  disease.name.en,
  disease.name.fa,
  disease.id.replace(/^(otc|dis)-/, '').replaceAll('_', ' '),
  ...disease.synonyms,
].filter((alias) => normalizeIdentityText(alias).length >= 5);

export function resolveTriageClinicalLinks(scenario: Scenario): TriageClinicalLink[] {
  const parts = textParts(scenario).map((part) => ({ ...part, normalized: normalizeIdentityText(part.text) }));
  const links = new Map<string, TriageClinicalLink>();
  const add = (targetId: string, targetType: TriageLinkTargetType, alias: string, source: TriageClinicalLink['source']) => {
    const key = `${targetType}:${targetId}`;
    if (!links.has(key)) {
      links.set(key, {
        scenarioId: scenario.id,
        targetId,
        targetType,
        confidence: 'suggested',
        matchedAlias: alias,
        source,
        reason: `Matched canonical alias "${alias}" in ${source}; requires clinical review.`,
      });
    }
  };

  DISEASES_REGISTRY.forEach((disease) => {
    for (const part of parts) {
      const alias = diseaseAliases(disease).find((candidate) => matchesAlias(part.normalized, candidate));
      if (alias) {
        add(diseaseIdentityId(disease), 'disease', alias, part.source);
        break;
      }
    }
  });

  MEDICINE_IDENTITIES.forEach((medicine) => {
    for (const part of parts) {
      const alias = medicine.aliases.find((candidate) => matchesAlias(part.normalized, candidate));
      if (alias) {
        add(medicine.id, 'medicine', alias, part.source);
        break;
      }
    }
  });

  return Array.from(links.values());
}

export const TRIAGE_CLINICAL_LINKS = OTC_SCENARIOS.flatMap(resolveTriageClinicalLinks);

export function getTriageClinicalLinks(scenarioId: string, targetType?: TriageLinkTargetType) {
  return TRIAGE_CLINICAL_LINKS.filter((link) => link.scenarioId === scenarioId && (!targetType || link.targetType === targetType));
}

export function getTriageLinkStats() {
  return {
    total: TRIAGE_CLINICAL_LINKS.length,
    scenariosWithLinks: new Set(TRIAGE_CLINICAL_LINKS.map((link) => link.scenarioId)).size,
    diseaseLinks: TRIAGE_CLINICAL_LINKS.filter((link) => link.targetType === 'disease').length,
    medicineLinks: TRIAGE_CLINICAL_LINKS.filter((link) => link.targetType === 'medicine').length,
  };
}
