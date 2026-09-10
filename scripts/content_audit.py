from pathlib import Path
import re, json

ROOT = Path(__file__).resolve().parents[1]

def text(path):
    return (ROOT / path).read_text(encoding='utf-8')

def ids_in(source):
    return re.findall(r"\bid:\s*['\"]([^'\"]+)['\"]", source)

def unique_dupes(values):
    counts = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return {k: v for k, v in counts.items() if v > 1}

files = {
    'diseases_registry': 'data/diseasesRegistry.ts',
    'shelf_products': 'data/shelf/shelfProducts.ts',
    'clinical_domains': 'data/shelf/clinicalDomains.ts',
    'clinical_concepts': 'data/shelf/clinicalConcepts.ts',
    'cyp': 'data/cypInteractionsData.ts',
    'clinical_scenarios': 'data/scenarios/clinicalScenarios.ts',
    'slang_scenarios': 'data/scenarios/slangScenarios.ts',
    'admin_scenarios': 'data/scenarios/adminScenarios.ts',
    'mechanisms': 'data/mechanismsRegistry.ts',
    'translations': 'data/otcClinicalTranslations.ts',
    'handbook_part1': 'src/data/handbook/part1.ts',
    'handbook_part2': 'src/data/handbook/part2.ts',
    'handbook_part3': 'src/data/handbook/part3.ts',
}

result = {'files': {}, 'cross_file_ids': {}, 'notes': []}
all_ids = {}
for name, rel in files.items():
    src = text(rel)
    ids = ids_in(src)
    result['files'][name] = {
        'path': rel,
        'bytes': len(src.encode('utf-8')),
        'id_fields': len(ids),
        'unique_id_fields': len(set(ids)),
        'duplicate_id_fields': unique_dupes(ids),
    }
    for item_id in set(ids):
        all_ids.setdefault(item_id, []).append(name)

result['cross_file_ids'] = {k: v for k, v in all_ids.items() if len(v) > 1}

# Explicit link fields and relationship-shaped content in disease and product data.
disease_src = text(files['diseases_registry'])
product_src = text(files['shelf_products'])
scenario_src = '\n'.join(text(files[n]) for n in ('clinical_scenarios', 'slang_scenarios', 'admin_scenarios'))
result['link_field_occurrences'] = {
    'disease_relatedShelfProducts': len(re.findall(r'relatedShelfProducts:', disease_src)),
    'disease_medicines': len(re.findall(r'\bmedicines:', disease_src)),
    'disease_otcOptions': len(re.findall(r'otcOptions:', disease_src)),
    'disease_rxOptions': len(re.findall(r'rxOptions:', disease_src)),
    'product_indications': len(re.findall(r'\bindications:', product_src)),
    'scenario_patientProfile': len(re.findall(r'patientProfile:', scenario_src)),
    'scenario_dialogue': len(re.findall(r'dialogue|dialogues|conversation', scenario_src, re.I)),
}

# Approximate named entries for top-level arrays, useful for planning and not a substitute for runtime validation.
result['top_level_markers'] = {
    'disease_registry_export': 'DISEASES_REGISTRY' in disease_src,
    'shelf_products_export': 'SHELF_PRODUCTS' in product_src,
    'cyp_enzyme_database_export': 'CYP_ENZYMES_DATABASE' in text(files['cyp']),
    'mechanism_registry_export': 'DRUG_MECHANISMS_REGISTRY' in text(files['mechanisms']),
}

result['notes'].extend([
    'Counts are source-level id-field counts; nested ids and category ids may coexist.',
    'Runtime deduplication in DISEASES_REGISTRY is implemented by id when combining core and converted OTC diseases.',
    'Cross-file ID overlap is a candidate signal only; semantic identity still requires normalization and review.',
])
print(json.dumps(result, ensure_ascii=False, indent=2))
