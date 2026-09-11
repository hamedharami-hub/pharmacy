import { describe, expect, it } from 'vitest';
import { DISEASES_REGISTRY, findDiseaseGuide } from '@/data/diseasesRegistry';
import { OTC_SCENARIOS } from '@/data/otcScenarios';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';
import { CLINICAL_DOMAINS } from '@/data/shelf/clinicalDomains';
import { getCalLabelInfo } from '@/data/shelf/calLabels';
import { getDiseasesForSubCategory } from '@/data/shelf/diseaseHelpers';
import { AUSTRALIAN_SCRIPT_TYPES_DATA } from '@/data/scriptTypesData';
import { REALISTIC_SCRIPTS_DATABASE } from '@/data/realisticScriptsData';
import { ALL_PHARMACY_CARDS } from '@/lib/pharmacy-data';
import { CYP_ENZYMES_DATABASE } from '@/data/cypInteractionsData';
import { SPECIAL_TRIAGE_CATEGORIES, hasTriageScenario, getScenariosForDisease } from '@/lib/diseaseTriageBridge';
import { CLINICAL_CONCEPTS_REGISTRY } from '@/data/shelf/clinicalConcepts';

describe('Full Application Clinical & Data Integrity Audit', () => {
  describe('Module 1: Clinical Diseases & Triage Registry', () => {
    it('contains at least 58 diseases with complete bilingual metadata and red flags', () => {
      expect(DISEASES_REGISTRY.length).toBeGreaterThanOrEqual(58);

      const seenIds = new Set<string>();
      DISEASES_REGISTRY.forEach((disease) => {
        expect(disease.id).toBeTruthy();
        expect(seenIds.has(disease.id)).toBe(false);
        seenIds.add(disease.id);

        expect(disease.name.en).toBeTruthy();
        expect(disease.name.fa).toBeTruthy();
        expect(disease.categoryId).toBeTruthy();

        // Bilingual Red Flags object check
        expect(Array.isArray(disease.redFlags?.en)).toBe(true);
        expect(disease.redFlags.en.length).toBeGreaterThan(0);
        expect(Array.isArray(disease.redFlags?.fa)).toBe(true);
        expect(disease.redFlags.fa.length).toBeGreaterThan(0);

        // Treatment options check
        expect(disease.treatment).toBeDefined();
      });
    });

    it('ensures all relatedShelfProducts point to existing shelf product IDs', () => {
      const shelfProductIds = new Set(SHELF_PRODUCTS.map((p) => p.id));
      const invalidLinks: { diseaseId: string; missingProduct: string }[] = [];

      DISEASES_REGISTRY.forEach((disease) => {
        if (disease.relatedShelfProducts) {
          disease.relatedShelfProducts.forEach((prodId) => {
            if (!shelfProductIds.has(prodId)) {
              invalidLinks.push({ diseaseId: disease.id, missingProduct: prodId });
            }
          });
        }
      });

      expect(invalidLinks).toEqual([]);
    });

    it('findDiseaseGuide resolves core clinical diseases by ID with highest precedence', () => {
      const core = findDiseaseGuide('dis-asthma');
      expect(core).toBeDefined();
      expect(core?.id).toBe('dis-asthma');
      expect(core?.name.en).toContain('Asthma');

      const otc = findDiseaseGuide('otc-chesty_cough');
      expect(otc).toBeDefined();
      expect(otc?.name.en).toBeTruthy();
    });

    it('all 32 triage scenarios have valid structures and dialogue options', () => {
      expect(OTC_SCENARIOS.length).toBe(32);
      const scenarioIds = new Set<string>();

      OTC_SCENARIOS.forEach((scenario) => {
        expect(scenario.id).toBeTruthy();
        expect(scenarioIds.has(scenario.id)).toBe(false);
        scenarioIds.add(scenario.id);

        expect(scenario.title.en).toBeTruthy();
        expect(scenario.title.fa).toBeTruthy();
        expect(scenario.patientProfile.presentation.en).toBeTruthy();
        expect(scenario.patientProfile.presentation.fa).toBeTruthy();
        expect(scenario.dialogueOptions.length).toBeGreaterThan(0);
        expect(scenario.clinicalOutcome.recommendation.en).toBeTruthy();
      });
    });

    it('special triage categories (slang and admin) are properly registered', () => {
      expect(SPECIAL_TRIAGE_CATEGORIES.length).toBe(2);
      const slangCat = SPECIAL_TRIAGE_CATEGORIES.find((c) => c.id === 'special_slang');
      const adminCat = SPECIAL_TRIAGE_CATEGORIES.find((c) => c.id === 'special_admin');

      expect(slangCat).toBeDefined();
      expect(slangCat?.scenarios.length).toBe(4);
      expect(adminCat).toBeDefined();
      expect(adminCat?.scenarios.length).toBe(4);
    });
  });

  describe('Module 2: Product Shelf & Clinical Domains', () => {
    it('verifies all 121 shelf products have valid domains, subcategories, and CAL labels', () => {
      expect(SHELF_PRODUCTS.length).toBeGreaterThanOrEqual(120);

      const validDomainIds = new Set(CLINICAL_DOMAINS.map((d) => d.id));

      SHELF_PRODUCTS.forEach((prod) => {
        expect(prod.id).toBeTruthy();
        expect(prod.brandName).toBeTruthy();
        expect(prod.categoryId).toBeTruthy();
        expect(validDomainIds.has(prod.categoryId!)).toBe(true);

        const domain = CLINICAL_DOMAINS.find((d) => d.id === prod.categoryId);
        expect(domain).toBeDefined();

        if (prod.subcategoryId && domain) {
          const validSubIds = new Set(domain.subcategories.map((s) => s.id));
          expect(validSubIds.has(prod.subcategoryId)).toBe(true);
        }

        // All CAL labels resolve correctly
        prod.calLabels.forEach((calCode) => {
          const info = getCalLabelInfo(calCode);
          expect(info).toBeDefined();
          expect(info.code).toBeTruthy();
        });
      });
    });

    it('getDiseasesForSubCategory resolves diseases without runtime errors', () => {
      CLINICAL_DOMAINS.forEach((domain) => {
        domain.subcategories.forEach((subCat) => {
          const diseases = getDiseasesForSubCategory(subCat.id);
          expect(Array.isArray(diseases)).toBe(true);
        });
      });
    });
  });

  describe('Module 3: Fred Dispense Plus & Australian Script Scenarios', () => {
    it('contains valid script types with legal rules, expiry, and interactive hotspots', () => {
      expect(AUSTRALIAN_SCRIPT_TYPES_DATA.length).toBeGreaterThanOrEqual(6);
      AUSTRALIAN_SCRIPT_TYPES_DATA.forEach((script) => {
        expect(script.id).toBeTruthy();
        expect(script.title_fa).toBeTruthy();
        expect(script.title_en).toBeTruthy();
        expect(script.legal_expiry_months).toBeGreaterThan(0);
        expect(script.hotspots.length).toBeGreaterThan(0);
        expect(script.mock_data.patient_name).toBeTruthy();
        expect(script.mock_data.pbs_code).toBeTruthy();
      });
    });

    it('contains realistic script models with full legal and clinical tips', () => {
      expect(REALISTIC_SCRIPTS_DATABASE.length).toBeGreaterThanOrEqual(6);
      REALISTIC_SCRIPTS_DATABASE.forEach((script) => {
        expect(script.id).toBeTruthy();
        expect(script.title_fa).toBeTruthy();
        expect(script.hotspots.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Module 4: Clinical Pharmacology & Knowledge Hub', () => {
    it('contains comprehensive pharmacy cards with bilingual titles and content', () => {
      expect(ALL_PHARMACY_CARDS.length).toBeGreaterThan(0);
      ALL_PHARMACY_CARDS.forEach((card) => {
        expect(card.id).toBeTruthy();
        expect(card.title.en).toBeTruthy();
        expect(card.title.fa).toBeTruthy();
      });
    });

    it('CYP interactions table is fully populated with clinical enzymes', () => {
      const enzymes = Object.values(CYP_ENZYMES_DATABASE);
      expect(enzymes.length).toBeGreaterThanOrEqual(5);
      enzymes.forEach((cyp) => {
        expect(cyp.id).toBeTruthy();
        expect(cyp.substrates.length).toBeGreaterThan(0);
        expect(cyp.inhibitors.length).toBeGreaterThan(0);
        // CYP2D6 is clinically non-inducible in humans, whereas other CYPs are inducible
        expect(Array.isArray(cyp.inducers)).toBe(true);
        expect(cyp.clinicalSignificanceEn).toBeTruthy();
        expect(cyp.clinicalSignificanceFa).toBeTruthy();
      });
    });
  });

  describe('Cross-Module Clinical Concept Integrations', () => {
    it('all registered clinical concepts have bilingual definitions and mechanisms', () => {
      const concepts = Object.values(CLINICAL_CONCEPTS_REGISTRY);
      expect(concepts.length).toBeGreaterThan(0);
      concepts.forEach((concept) => {
        expect(concept.id).toBeTruthy();
        expect(concept.titleEn).toBeTruthy();
        expect(concept.titleFa).toBeTruthy();
        expect(concept.descriptionEn).toBeTruthy();
        expect(concept.descriptionFa).toBeTruthy();
      });
    });

    it('disease triage bridge has working bidirectional links for core diseases', () => {
      const respScenarios = getScenariosForDisease('dis-asthma');
      expect(respScenarios.length).toBeGreaterThan(0);
      expect(hasTriageScenario('dis-asthma')).toBe(true);
    });
  });
});
