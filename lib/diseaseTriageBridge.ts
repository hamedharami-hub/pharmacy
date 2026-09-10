import { DISEASES_REGISTRY, DiseaseInfo, findDiseaseGuide } from '@/data/diseasesRegistry';
import { OTC_SCENARIOS, Scenario } from '@/data/otcScenarios';
import { TRIAGE_CLINICAL_LINKS } from '@/lib/triageClinicalLinks';
import { normalizeIdentityText } from '@/lib/clinicalIdentity';

export interface SpecialTriageCategory {
  id: string;
  name: { fa: string; en: string };
  description: { fa: string; en: string };
  color: string;
  iconName: string;
  scenarios: Scenario[];
}

// Slang and Admin scenarios that do not correspond to a single organ-system disease
export const SLANG_SCENARIOS = OTC_SCENARIOS.filter((s) => s.id.startsWith('slang-'));
export const ADMIN_SCENARIOS = OTC_SCENARIOS.filter((s) => s.id.startsWith('admin-'));

export const SPECIAL_TRIAGE_CATEGORIES: SpecialTriageCategory[] = [
  {
    id: 'special_slang',
    name: {
      fa: 'زبان محاوره‌ای و اصطلاحات (Slang)',
      en: 'Australian Slang & Colloquial Triage',
    },
    description: {
      fa: 'سناریوهای مهارت‌های ارتباطی، اصطلاحات خیابانی بیماران استرالیایی و درک معنای بالینی آن‌ها.',
      en: 'Communication skills and real Australian colloquial pharmacy terms with clinical translation.',
    },
    color: 'amber',
    iconName: 'MessageSquareText',
    scenarios: SLANG_SCENARIOS,
  },
  {
    id: 'special_admin',
    name: {
      fa: 'قوانین، اخلاق و حل اختلاف (Admin & Law)',
      en: 'Pharmacy Law, Ethics & Disputes',
    },
    description: {
      fa: 'سناریوهای حل اختلاف، نسخه‌های مخدوش، سوءمصرف و قوانین نظارتی بورد داروسازی استرالیا.',
      en: 'Challenging interactions, counterfeit scripts, regulated Schedule 8/S4D medicines and Board guidelines.',
    },
    color: 'rose',
    iconName: 'Scale',
    scenarios: ADMIN_SCENARIOS,
  },
];

// Pre-computed map of diseaseId -> scenarios
const diseaseScenariosMap = new Map<string, Scenario[]>();
const scenarioToDiseaseMap = new Map<string, string>();

function indexScenarios() {
  if (diseaseScenariosMap.size > 0) return;

  // Initialize empty arrays for all diseases
  DISEASES_REGISTRY.forEach((d) => {
    diseaseScenariosMap.set(d.id, []);
  });

  // 1. Index clinical links from triageClinicalLinks
  TRIAGE_CLINICAL_LINKS.forEach((link) => {
    if (link.targetType !== 'disease') return;
    const diseaseId = link.targetId.replace(/^disease:/, '');
    const scenario = OTC_SCENARIOS.find((s) => s.id === link.scenarioId);
    if (!scenario) return;

    // Find disease record
    const targetDisease = DISEASES_REGISTRY.find(
      (d) => d.id === diseaseId || d.id === `dis-${diseaseId}` || d.id === `otc-${diseaseId}` || d.id.replace(/^(dis|otc)-/, '') === diseaseId
    );
    if (targetDisease) {
      const list = diseaseScenariosMap.get(targetDisease.id) || [];
      if (!list.some((s) => s.id === scenario.id)) {
        list.push(scenario);
        diseaseScenariosMap.set(targetDisease.id, list);
      }
      if (!scenarioToDiseaseMap.has(scenario.id)) {
        scenarioToDiseaseMap.set(scenario.id, targetDisease.id);
      }
    }
  });

  // 2. Index via findDiseaseGuide for clinical scenarios
  OTC_SCENARIOS.forEach((scenario) => {
    if (scenario.id.startsWith('slang-') || scenario.id.startsWith('admin-')) return;
    const guide = findDiseaseGuide(scenario);
    if (guide) {
      const list = diseaseScenariosMap.get(guide.id) || [];
      if (!list.some((s) => s.id === scenario.id)) {
        list.push(scenario);
        diseaseScenariosMap.set(guide.id, list);
      }
      if (!scenarioToDiseaseMap.has(scenario.id)) {
        scenarioToDiseaseMap.set(scenario.id, guide.id);
      }
    }
  });

  // 3. Match by name or synonym tokens
  OTC_SCENARIOS.forEach((scenario) => {
    if (scenarioToDiseaseMap.has(scenario.id) || scenario.id.startsWith('slang-') || scenario.id.startsWith('admin-')) return;
    const scenarioTitleNorm = normalizeIdentityText(scenario.title.en + ' ' + scenario.title.fa);
    for (const disease of DISEASES_REGISTRY) {
      const diseaseNameEn = normalizeIdentityText(disease.name.en);
      const diseaseNameFa = normalizeIdentityText(disease.name.fa);
      if (
        (diseaseNameEn.length > 3 && scenarioTitleNorm.includes(diseaseNameEn)) ||
        (diseaseNameFa.length > 3 && scenarioTitleNorm.includes(diseaseNameFa))
      ) {
        const list = diseaseScenariosMap.get(disease.id) || [];
        if (!list.some((s) => s.id === scenario.id)) {
          list.push(scenario);
          diseaseScenariosMap.set(disease.id, list);
        }
        scenarioToDiseaseMap.set(scenario.id, disease.id);
        break;
      }
    }
  });
}

// Initialize once
indexScenarios();

export function getScenariosForDisease(diseaseId: string): Scenario[] {
  indexScenarios();
  return diseaseScenariosMap.get(diseaseId) || [];
}

export function hasTriageScenario(diseaseId: string): boolean {
  indexScenarios();
  const scenarios = diseaseScenariosMap.get(diseaseId);
  return Boolean(scenarios && scenarios.length > 0);
}

export function getDiseaseForScenario(scenarioId: string): DiseaseInfo | null {
  indexScenarios();
  const diseaseId = scenarioToDiseaseMap.get(scenarioId);
  if (!diseaseId) return null;
  return DISEASES_REGISTRY.find((d) => d.id === diseaseId) || null;
}

export function getTriageBridgeStats() {
  indexScenarios();
  let diseasesWithTriageCount = 0;
  let totalMappedScenarios = 0;

  diseaseScenariosMap.forEach((scenarios) => {
    if (scenarios.length > 0) {
      diseasesWithTriageCount++;
      totalMappedScenarios += scenarios.length;
    }
  });

  return {
    totalDiseases: DISEASES_REGISTRY.length,
    diseasesWithTriage: diseasesWithTriageCount,
    totalScenarios: OTC_SCENARIOS.length,
    slangScenariosCount: SLANG_SCENARIOS.length,
    adminScenariosCount: ADMIN_SCENARIOS.length,
  };
}
