import { DiseaseInfo } from '@/data/diseasesRegistry';

export interface DiseaseSubcategoryDef {
  id: string;
  categoryId: string;
  name: { fa: string; en: string };
  matchKeywords: string[];
}

export const DISEASE_SUBCATEGORIES: Record<string, DiseaseSubcategoryDef[]> = {
  resp: [
    {
      id: 'resp-lower',
      categoryId: 'resp',
      name: { fa: 'مجاری تنفسی تحتانی و مزمن (آسم و COPD)', en: 'Lower Airway & Chronic' },
      matchKeywords: ['asthma', 'copd', 'bronch', 'wheez', 'آسم', 'برونش'],
    },
    {
      id: 'resp-upper',
      categoryId: 'resp',
      name: { fa: 'رینیت آلرژیک، سینوس و احتقان', en: 'Allergic Rhinitis & Sinuses' },
      matchKeywords: ['rhinitis', 'allergy', 'allergic', 'sinus', 'hay fever', 'رینیت', 'آلرژیک', 'سینوس'],
    },
    {
      id: 'resp-cough-throat',
      categoryId: 'resp',
      name: { fa: 'سرفه، سرماخوردگی و گلودرد', en: 'Cough, Cold & Sore Throat' },
      matchKeywords: ['cough', 'cold', 'sore throat', 'pharyngitis', 'throat', 'سرفه', 'گلودرد', 'سرما'],
    },
  ],
  gi: [
    {
      id: 'gi-upper',
      categoryId: 'gi',
      name: { fa: 'معده، رفلاکس و سوء‌هاضمه', en: 'Upper GI, Reflux & Dyspepsia' },
      matchKeywords: ['gerd', 'reflux', 'ulcer', 'dyspepsia', 'heartburn', 'معده', 'رفلاکس', 'زخم'],
    },
    {
      id: 'gi-lower',
      categoryId: 'gi',
      name: { fa: 'روده، یبوست، اسهال و IBS', en: 'Bowel, Constipation & Diarrhoea' },
      matchKeywords: ['constipation', 'diarrhoea', 'diarrhea', 'ibs', 'bowel', 'یبوست', 'اسهال', 'روده'],
    },
    {
      id: 'gi-perianal',
      categoryId: 'gi',
      name: { fa: 'بواسیر و آنورکتال', en: 'Haemorrhoids & Perianal' },
      matchKeywords: ['haemorrhoid', 'hemorrhoid', 'fissure', 'piles', 'بواسیر', 'شقاق'],
    },
  ],
  derma: [
    {
      id: 'derma-inflam',
      categoryId: 'derma',
      name: { fa: 'التهابی و مزمن (اگزما، پسوریازیس)', en: 'Eczema & Dermatitis' },
      matchKeywords: ['eczema', 'dermatitis', 'psoriasis', 'اگزما', 'پسوریازیس', 'درماتیت'],
    },
    {
      id: 'derma-infect',
      categoryId: 'derma',
      name: { fa: 'عفونت‌های قارچی و انگلی پوست', en: 'Fungal & Infestations' },
      matchKeywords: ['tinea', 'fungal', 'athlete', 'ringworm', 'lice', 'scabies', 'قارچ', 'شپش', 'گال'],
    },
    {
      id: 'derma-acne',
      categoryId: 'derma',
      name: { fa: 'آکنه، زگیل و کراتین', en: 'Acne, Warts & Corns' },
      matchKeywords: ['acne', 'wart', 'corn', 'callus', 'آکنه', 'زگیل', 'میخچه'],
    },
    {
      id: 'derma-trauma',
      categoryId: 'derma',
      name: { fa: 'سوختگی، زخم و نیش حشرات', en: 'Burns, Bites & Wounds' },
      matchKeywords: ['burn', 'sunburn', 'bite', 'sting', 'wound', 'سوختگی', 'نیش', 'زخم'],
    },
  ],
  pain: [
    {
      id: 'pain-headache',
      categoryId: 'pain',
      name: { fa: 'سردرد و میگرن', en: 'Headache & Migraine' },
      matchKeywords: ['headache', 'migraine', 'tension', 'سردرد', 'میگرن'],
    },
    {
      id: 'pain-joint',
      categoryId: 'pain',
      name: { fa: 'مفاصل، نقرس و آرتروز', en: 'Joints, Gout & Arthritis' },
      matchKeywords: ['gout', 'arthritis', 'osteoarthritis', 'joint', 'نقرس', 'آرتروز', 'مفصل'],
    },
    {
      id: 'pain-muscular',
      categoryId: 'pain',
      name: { fa: 'عضلانی اسکلتی، کمردرد و دیسمنوره', en: 'Sprains, Strains & Dysmenorrhoea' },
      matchKeywords: ['sprain', 'strain', 'muscular', 'back pain', 'dysmenorrhoea', 'عضلانی', 'کمردرد', 'قاعدگی'],
    },
  ],
  cardio: [
    {
      id: 'cardio-vascular',
      categoryId: 'cardio',
      name: { fa: 'فشار خون و بیماری‌های عروقی', en: 'Hypertension & Vascular' },
      matchKeywords: ['hypertension', 'blood pressure', 'vascular', 'فشار خون', 'عروق'],
    },
    {
      id: 'cardio-metabolic',
      categoryId: 'cardio',
      name: { fa: 'دیابت و اختلالات چربی', en: 'Diabetes & Dyslipidaemia' },
      matchKeywords: ['diabetes', 'lipid', 'dyslipidaemia', 'cholesterol', 'دیابت', 'چربی'],
    },
  ],
  neuro: [
    {
      id: 'neuro-sleep',
      categoryId: 'neuro',
      name: { fa: 'بی‌خوابی و کیفیت خواب', en: 'Insomnia & Sleep Disorders' },
      matchKeywords: ['insomnia', 'sleep', 'خواب', 'بی‌خوابی'],
    },
    {
      id: 'neuro-addiction',
      categoryId: 'neuro',
      name: { fa: 'ترک دخانیات و نیکوتین', en: 'Smoking Cessation & Nicotine' },
      matchKeywords: ['smoking', 'nicotine', 'tobacco', 'سیگار', 'نیکوتین', 'دخانیات'],
    },
  ],
  infect: [
    {
      id: 'infect-parasite',
      categoryId: 'infect',
      name: { fa: 'انگل‌ها و کرمک (Threadworms)', en: 'Helminths & Parasites' },
      matchKeywords: ['worm', 'pinworm', 'threadworm', 'parasite', 'انگل', 'کرمک'],
    },
    {
      id: 'infect-viral',
      categoryId: 'infect',
      name: { fa: 'عفونت‌های ویروسی تاولی (زونا)', en: 'Viral & Herpes Zoster' },
      matchKeywords: ['zoster', 'shingles', 'herpes', 'chickenpox', 'زونا', 'آبله'],
    },
  ],
  eye_ear: [
    {
      id: 'eye_ear-eye',
      categoryId: 'eye_ear',
      name: { fa: 'چشم، ملتحمه و خشکی چشم', en: 'Ophthalmic & Dry Eye' },
      matchKeywords: ['conjunctivitis', 'dry eye', 'eye', 'blepharitis', 'stye', 'hordeolum', 'چشم', 'ملتحمه', 'بلفاریت'],
    },
    {
      id: 'eye_ear-ear',
      categoryId: 'eye_ear',
      name: { fa: 'گوش، مجرا و جرم گوش', en: 'Otic & Ear Wax' },
      matchKeywords: ['ear', 'wax', 'otitis', 'گوش', 'جرم گوش'],
    },
  ],
  women_men: [
    {
      id: 'wm-women',
      categoryId: 'women_men',
      name: { fa: 'سلامت زنان و مجاری ادراری (UTI / Thrush)', en: "Women's Health & UTI" },
      matchKeywords: ['uti', 'thrush', 'candidiasis', 'vaginal', 'cystitis', 'contraception', 'بانوان', 'ادراری', 'واژینال', 'عفونت ادراری'],
    },
    {
      id: 'wm-oral',
      categoryId: 'women_men',
      name: { fa: 'مخاط دهان، لثه و تبخال لب', en: 'Oral Mucosa & Cold Sores' },
      matchKeywords: ['mouth', 'ulcer', 'cold sore', 'gingivitis', 'dental', 'herpes labialis', 'دهان', 'آفت', 'تبخال', 'لثه'],
    },
  ],
};

export function getSubcategoriesForCategory(categoryId: string): DiseaseSubcategoryDef[] {
  return DISEASE_SUBCATEGORIES[categoryId] || [];
}

export function matchDiseaseToSubcategory(disease: DiseaseInfo, subcategoryId: string): boolean {
  if (subcategoryId === 'ALL') return true;
  const subcats = DISEASE_SUBCATEGORIES[disease.categoryId] || [];
  const targetSubcat = subcats.find((s) => s.id === subcategoryId);
  if (!targetSubcat) return true;

  const textToMatch = `${disease.id} ${disease.name.en} ${disease.name.fa} ${disease.synonyms.join(' ')} ${disease.overview.en} ${disease.overview.fa}`.toLowerCase();
  return targetSubcat.matchKeywords.some((kw) => textToMatch.includes(kw.toLowerCase()));
}
