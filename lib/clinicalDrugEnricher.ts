import { CONCISE_DRUG_DATABASE, ConciseDrugInfo } from '@/components/MechanismPopover';
import { SHELF_PRODUCTS } from '@/data/shelf/shelfProducts';

export interface EnrichedDrugMonograph {
  fullName: {
    fa: string;
    en: string;
  };
  genericName: string;
  brandNames: string[];
  mechanism: {
    fa: string;
    en: string;
  };
  keyPearls: {
    fa: string[];
    en: string[];
  };
  dosageSummary?: {
    fa: string;
    en: string;
  };
}

// Comprehensive registry of quick concise mechanisms for all Australian OTC & Guideline Pharmacotherapies
const CLINICAL_MECHANISMS_DICT: Record<string, { fa: string; en: string }> = {
  'benzoyl peroxide': {
    fa: 'آنتی‌باکتریال و کومدولیتیک موضعی با آزادسازی رادیکال‌های آزاد اکسیژن و نابودی باکتری Cutibacterium acnes و لایه‌برداری ملایم.',
    en: 'Topical antibacterial and comedolytic agent releasing reactive oxygen species to kill Cutibacterium acnes and promote follicular desquamation.',
  },
  'azelaic acid': {
    fa: 'مهارکننده سنتز پروتئین باکتریایی و کاهش هایپرکراتینیزاسیون فولیکولی همراه با مهار تیروزیناز و کاهش لکه‌های پوستی.',
    en: 'Inhibits follicular hyperkeratinization and microbial cellular protein synthesis, plus competitive tyrosinase inhibition reducing hyperpigmentation.',
  },
  'glyceryl trinitrate': {
    fa: 'اهداکننده اکسید نیتریک (NO) با تحریک گوانین سیکلاز، کاهش کلسیم درون‌سلولی، شل کردن اسفنکتر داخلی مقعد و افزایش خون‌رسانی موضعی.',
    en: 'Nitric oxide (NO) donor that relaxes internal anal sphincter smooth muscle, reduces hypertonicity, and restores microvascular perfusion.',
  },
  'rectogesic': {
    fa: 'اهداکننده اکسید نیتریک (NO) با شل کردن اسفنکتر مقعد و کاهش فشار داخل کانال جهت تسکین درد و ترمیم شقاق.',
    en: 'Nitric oxide (NO) donor relaxing the internal anal sphincter to improve anoderm perfusion and facilitate fissure healing.',
  },
  'hydrocortisone': {
    fa: 'کورتیکواستروئید موضعی با سرکوب مهاجرت لکوسیت‌ها، مهار فسفولیپاز A2 و کاهش سنتز سایتوکاین‌های پیش‌التهابی.',
    en: 'Mild topical corticosteroid inhibiting phospholipase A2 and pro-inflammatory cytokine transcription to relieve itching and swelling.',
  },
  'cinchocaine': {
    fa: 'بی‌حس‌کننده موضعی با بلوک کانال‌های سدیمی وابسته به ولتاژ و مهار هدایت پیام‌های درد در انتهای اعصاب حسی.',
    en: 'Local anesthetic blocking voltage-gated sodium channels, preventing initiation and conduction of sensory pain impulses.',
  },
  'salbutamol': {
    fa: 'آگونیست انتخابی گیرنده‌های بتا-۲ آدرنرژیک با افزایش cAMP، شل شدن عضلات صاف برونش و گشادی سریع مجاری تنفسی.',
    en: 'Selective beta-2 adrenergic agonist stimulating intracellular adenylate cyclase / cAMP, causing rapid bronchodilation.',
  },
  'mometasone': {
    fa: 'کورتیکواستروئید قوی داخل بینی با مهار رونویسی میانجی‌های التهابی (لوکوترین‌ها و پروستاگلاندین‌ها) در مخاط بینی.',
    en: 'Potent topical glucocorticosteroid with anti-inflammatory and vasoconstrictive properties on nasal mucosa.',
  },
  'fluticasone': {
    fa: 'کورتیکواستروئید داخل بینی با میل اتصالی بالا به گیرنده گلوکوکورتیکوئید و مهار ترشح اینترلوکین‌ها و ائوزینوفیل‌ها.',
    en: 'Synthetic glucocorticosteroid with high affinity for glucocorticoid receptors, suppressing allergic eosinophilic airway inflammation.',
  },
  'azelastine': {
    fa: 'آنتاگونیست انتخابی گیرنده H1 هیستامینی و پایدارکننده ماست‌سل‌ها با شروع اثر فوق‌العاده سریع (۱۵ دقیقه).',
    en: 'Second-generation histamine H1-receptor antagonist and mast cell stabilizer with rapid onset of action within 15 minutes.',
  },
  'colchicine': {
    fa: 'اتصال به توبولین و مهار پلیمریزاسیون میکروتوبول‌ها، مهار مهاجرت نوتروفیل‌ها و فعال‌سازی اینفلامازوم NLRP3 در پاسخ به کریستال‌های اورات.',
    en: 'Binds to tubulin inhibiting microtubule assembly, neutrophil chemotaxis, and NLRP3 inflammasome activation in gouty synovitis.',
  },
  'allopurinol': {
    fa: 'مهارکننده آنزیم گزانتین اکسیداز با کاهش تولید اسید اوریک از هیپوگزانتین و گزانتین و حل کردن تدریجی کریستال‌های توفوس.',
    en: 'Competitive inhibitor of xanthine oxidase, blocking conversion of hypoxanthine and xanthine to uric acid.',
  },
  'esomeprazole': {
    fa: 'مهارکننده اختصاصی و غیرقابل برگشت پمپ پروتون (H+/K+-ATPase) در سلول‌های پاریتال معده و سرکوب قوی ترشح اسید.',
    en: 'Proton pump inhibitor irreversibly binding to active H+/K+-ATPase sulfhydryl groups in parietal cells, suppressing basal and stimulated acid secretion.',
  },
  'clotrimazole': {
    fa: 'ضدقارچ ایمیدازول با مهار آنزیم سیتوکروم P450 14α-دمتیلاز، توقف ساخت ارگوسترول و ناپایداری غشای سلولی قارچ.',
    en: 'Imidazole antifungal inhibiting fungal cytochrome P450 14-alpha-demethylase, disrupting fungal cell membrane ergosterol synthesis.',
  },
  'fluconazole': {
    fa: 'تری‌آزول سیستمیک انتخابی با نفوذ بافتی عالی و مهار بیوسنتز ارگوسترول قارچی در گونه‌های حساس کاندیدا.',
    en: 'Highly selective systemic triazole inhibitor of fungal CYP51, blocking ergosterol synthesis in Candida species.',
  },
  'terbinafine': {
    fa: 'مهارکننده قوی آنزیم اسکوالن اپوکسیداز با ایجاد سمیت داخل‌سلولی با تجمع اسکوالن و تخریب مستقیم دیواره سلولی قارچ (قارچ‌کش).',
    en: 'Allylamine antifungal inhibiting squalene epoxidase, causing fungicidal accumulation of toxic squalene and ergosterol deficiency.',
  },
  'calcipotriol': {
    fa: 'آنالوگ مصنوعی ویتامین D3 با اتصال به گیرنده‌های VDR و تنظیم تمایز و مهار تکثیر بیش از حد کراتینوسیت‌های پوست.',
    en: 'Synthetic vitamin D3 analogue binding to epidermal VDR to normalize keratinocyte proliferation and differentiation in psoriasis.',
  },
  'betamethasone': {
    fa: 'کورتیکواستروئید قوی با سرکوب رونویسی واسطه‌های پیش‌التهابی، مهار نفوذ سلول‌های ایمنی و رفع ضایعات پسوریازیس.',
    en: 'Potent corticosteroid delivering local immunosuppressive, anti-inflammatory, and vasoconstrictive actions.',
  },
  'paracetamol': {
    fa: 'مهارکننده سنتز پروستاگلاندین‌ها در سیستم عصبی مرکزی (احتمالاً از طریق آنزیم COX-3/COX-1b) و اثر بر مسیرهای سروتونرژیک نزولی درد و مرکز تنظیم دمای هیپوتالاموس.',
    en: 'Inhibits central prostaglandin synthesis in the CNS and modulates descending serotonergic inhibitory pain pathways and hypothalamic thermoregulatory center.',
  },
  'ibuprofen': {
    fa: 'مهارکننده غیراختصاصی آنزیم‌های سیکلواکسیژناز (COX-1 و COX-2) و مهار تبدیل آراشیدونیک اسید به پروستاگلاندین‌های مولد درد و التهاب.',
    en: 'Reversible non-selective inhibitor of cyclooxygenase enzymes (COX-1 and COX-2), reducing synthesis of pro-inflammatory prostaglandins.',
  },
  'loperamide': {
    fa: 'آگونیست انتخابی گیرنده‌های مو-اوپیوئیدی (µ-opioid) در شبکه عصبی روده، مهار حرکات دودی (پریستالسیس)، افزایش زمان ترانزیت و افزایش بازجذب آب و الکترولیت‌ها.',
    en: 'Selective mu-opioid receptor agonist in the myenteric plexus, slowing gastrointestinal motility, increasing transit time, and enhancing fluid absorption.',
  },
  'mebendazole': {
    fa: 'اتصال انتخابی به زیرواحد بتا-توبولین در انگل، مهار پلیمریزاسیون میکروتوبول‌ها و مسدود کردن جذب گلوکز و تخلیه ذخایر گلیکوژن در کرم‌های انگلی.',
    en: 'Binds to helminthic beta-tubulin, selectively inhibiting microtubule polymerization and blocking glucose uptake to starve the parasite.',
  },
  'permethrin': {
    fa: 'تثبیت‌کننده کانال‌های سدیمی در غشای سلول‌های عصبی بندپایان (انگل جرب و شپش)، مهار رپلاریزاسیون، ایجاد فلج اسپاستیک و مرگ حشره.',
    en: 'Neurotoxin stabilizing neuronal voltage-gated sodium channels in arthropods, delaying repolarization, causing paralysis and death.',
  },
  'chloramphenicol': {
    fa: 'اتصال برگشت‌پذیر به زیرواحد 50S ریبوزوم باکتری و مهار تشکیل پیوند پپتیدی توسط پپتیدیل ترانسفراز و توقف سنتز پروتئین باکتریایی.',
    en: 'Binds reversibly to the 50S ribosomal subunit, inhibiting peptidyl transferase and blocking bacterial protein synthesis.',
  },
};

export function resolveDrugMonographDetails(
  rawName: string,
  rawBrands: string,
  rawDosing?: string,
  rawExtra?: string
): EnrichedDrugMonograph {
  const norm = (rawName || '').toLowerCase().trim();
  const brandsNorm = (rawBrands || '').toLowerCase().trim();

  // 1. Search shelf products for exact matching
  const matchingShelfProd = SHELF_PRODUCTS.find(p => {
    const pGeneric = p.genericName.toLowerCase();
    const pBrand = p.brandName.toLowerCase();
    return norm.includes(pGeneric) || pGeneric.includes(norm) ||
           brandsNorm.includes(pBrand) || pBrand.includes(brandsNorm);
  });

  // 2. Search concise database
  let conciseInfo: ConciseDrugInfo | undefined;
  for (const key of Object.keys(CONCISE_DRUG_DATABASE)) {
    if (norm.includes(key) || brandsNorm.includes(key) || key.includes(norm)) {
      conciseInfo = CONCISE_DRUG_DATABASE[key];
      break;
    }
  }

  // 3. Search clinical mechanisms dict
  let customMech: { fa: string; en: string } | undefined;
  for (const key of Object.keys(CLINICAL_MECHANISMS_DICT)) {
    if (norm.includes(key) || brandsNorm.includes(key) || key.includes(norm)) {
      customMech = CLINICAL_MECHANISMS_DICT[key];
      break;
    }
  }

  // Resolve Mechanism
  const mechanismFa = customMech?.fa || conciseInfo?.mechanismFa || (
    matchingShelfProd
      ? `داروی اختصاصی با اثر هدفمند بر گیرنده‌ها و واسطه‌های بیولوژیک مرتبط در شاخه درمانی استرالیا.`
      : 'مهار یا تعدیل فرآیندهای پاتوفیزیولوژیک بیماری مطابق با فارماکوپه داروسازی استرالیا (APF).'
  );

  const mechanismEn = customMech?.en || conciseInfo?.mechanismEn || (
    matchingShelfProd
      ? `Pharmacotherapeutic agent modulating biological targets and inflammatory pathways per Australian standards.`
      : 'Modulates disease pathophysiology in accordance with Australian Pharmacy Formulary (APF).'
  );

  // Resolve Key Pearls / Points
  const keyPearlsFa: string[] = [];
  const keyPearlsEn: string[] = [];

  if (matchingShelfProd?.counselingPoints) {
    matchingShelfProd.counselingPoints.forEach(cp => {
      if (cp.fa) keyPearlsFa.push(cp.fa);
      if (cp.en) keyPearlsEn.push(cp.en);
    });
  }

  if (conciseInfo?.cautionFa && !keyPearlsFa.includes(conciseInfo.cautionFa)) {
    keyPearlsFa.push(conciseInfo.cautionFa);
  }
  if (conciseInfo?.cautionEn && !keyPearlsEn.includes(conciseInfo.cautionEn)) {
    keyPearlsEn.push(conciseInfo.cautionEn);
  }

  if (rawExtra) {
    const rawLines = rawExtra.split(/\n|\.\s+/).map(l => l.trim()).filter(l => l.length > 5);
    rawLines.forEach(l => {
      if (!keyPearlsFa.includes(l) && !keyPearlsEn.includes(l)) {
        keyPearlsFa.push(l);
      }
    });
  }

  // Resolve Full Clean Names
  const fullEn = matchingShelfProd?.brandName 
    ? `${rawName} (${matchingShelfProd.brandName})` 
    : (conciseInfo?.nameEn || rawName);
    
  const fullFa = conciseInfo?.nameFa 
    ? conciseInfo.nameFa 
    : `${rawName} ${rawBrands ? `(برند: ${rawBrands})` : ''}`;

  return {
    fullName: {
      fa: fullFa,
      en: fullEn,
    },
    genericName: matchingShelfProd?.genericName || conciseInfo?.genericName || rawName,
    brandNames: matchingShelfProd?.equivalentBrands 
      ? [matchingShelfProd.brandName, ...matchingShelfProd.equivalentBrands] 
      : (conciseInfo?.brandNames || (rawBrands ? rawBrands.split(',').map(s => s.trim()) : [])),
    mechanism: {
      fa: mechanismFa,
      en: mechanismEn,
    },
    keyPearls: {
      fa: keyPearlsFa.length > 0 ? keyPearlsFa : ['مطابق با دستور داروساز و برچسب بسته‌بندی استرالیا مصرف شود.'],
      en: keyPearlsEn.length > 0 ? keyPearlsEn : ['Take strictly as directed by pharmacist and follow Australian product label.'],
    },
    dosageSummary: {
      fa: rawDosing || matchingShelfProd?.counselingPoints?.[0]?.fa || conciseInfo?.doseFa || 'دوزبندی استاندارد بالینی',
      en: rawDosing || matchingShelfProd?.counselingPoints?.[0]?.en || conciseInfo?.doseEn || 'Standard clinical dosing',
    },
  };
}
