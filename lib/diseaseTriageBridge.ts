import { DISEASES_REGISTRY, DiseaseInfo } from '@/data/diseasesRegistry';
import { OTC_SCENARIOS, Scenario } from '@/data/otcScenarios';

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

// Only this curated bridge can launch a triage scenario from a disease page.
// Text-matched clinical links remain review-only data and must never create a direct route.
const DISEASE_TRIAGE_SCENARIO_IDS: Record<string, readonly string[]> = {
  'dis-asthma': ['nsaid-safety-check'],
  'dis-soft-tissue-injury': ['musculoskeletal-triage', 'ankle-ricer-protocol'],
  'otc-burns_sunburn': ['sunburn-triage'],
  'otc-chickenpox': ['chickenpox-advisory'],
  'otc-cold_sores': ['coldsore-triage'],
  'otc-constipation': ['laxative-triage'],
  'otc-chesty_cough': ['cough-triage'],
  'otc-dry_cough': ['cough-triage'],
  'otc-diarrhoea': ['diarrhea-triage'],
  'otc-eczema': ['hydrocortisone-triage'],
  'otc-gord_heartburn': ['dyspepsia-triage', 'heartburn-gord-triage'],
  'otc-hayfever': ['hayfever-triage'],
  'otc-motion_sickness': ['slang-motion-sickness-boat'],
  'otc-nasal_congestion': ['s3-pseudoephedrine', 's3-pseudoephedrine-conflict'],
  'otc-pain_relief': ['panadol-osteo-triage', 'nsaid-safety-check'],
  'otc-shingles': ['shingrix-vaccine'],
  'otc-smoking_cessation': ['smoking-cessation-5as'],
  'otc-swimmers_ear': ['ear-triage'],
  'otc-vaginal_thrush': ['thrush-triage'],
  'otc-worms_pinworms': ['pinworm-triage'],
};

// Pre-computed map of diseaseId -> scenarios
const diseaseScenariosMap = new Map<string, Scenario[]>();
const scenarioToDiseaseMap = new Map<string, string>();

function indexScenarios() {
  if (diseaseScenariosMap.size > 0) return;

  // Initialize empty arrays for all diseases
  DISEASES_REGISTRY.forEach((d) => {
    diseaseScenariosMap.set(d.id, []);
  });

  Object.entries(DISEASE_TRIAGE_SCENARIO_IDS).forEach(([diseaseId, scenarioIds]) => {
    if (!diseaseScenariosMap.has(diseaseId)) return;
    const scenarios = scenarioIds
      .map((scenarioId) => OTC_SCENARIOS.find((scenario) => scenario.id === scenarioId))
      .filter((scenario): scenario is Scenario => Boolean(scenario));
    diseaseScenariosMap.set(diseaseId, scenarios);
    scenarios.forEach((scenario) => {
      if (!scenarioToDiseaseMap.has(scenario.id)) scenarioToDiseaseMap.set(scenario.id, diseaseId);
    });
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
