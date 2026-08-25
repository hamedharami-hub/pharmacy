import { NextResponse } from 'next/server';
import { executeAiInference } from '@/lib/aiService';
import { robustJsonParse } from '@/lib/robustJsonParser';

// TODO: Add rate limiting and authentication for production
export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const {
      topic = 'Clinical Pharmacy',
      category = 'Pharmacotherapy',
      count = 3,
      contextSnippet,
      moduleNumber = 1,
      moduleName = 'Clinical Module',
      generationMode = 'auto',
      provider = 'gemini',
      model = 'gemini-2.5-flash',
      apiKey,
      temperature = 0.2,
      customPrompt,
    } = body;

    const modeInstructionsMap: Record<string, string> = {
      mcq: `MODE: MULTIPLE-CHOICE CLINICAL QUESTIONS (Australian Pharmacy Practice).
Generate 4-option clinical scenario MCQs with:
- "mcqOptions": array of 4 options [{ "id": "A", "text": { "fa": "...", "en": "..." }, "isCorrect": true/false, "explanation": { "fa": "...", "en": "..." } }]. EXACTLY ONE option must have isCorrect: true.
- "distractorRationale": { "fa": "استدلال بالینی تفکیک گزینه‌ها و علت نامناسب بودن سایر انتخاب‌ها", "en": "Clinical rationale explaining why other options are inappropriate based on AMH/eTG" }.
- "type": "mcq"`,
      triage_redflag: `MODE: AUSTRALIAN OTC TRIAGE & RED FLAGS (Primary Healthcare Protocols).
Generate clinical primary care triage cases assessing whether to supply OTC medicine or refer:
- "triageOutcome": "supply_otc" | "urgent_referral" | "gp_referral"
- "pearl": { "fa": "علائم هشداردهنده حیاتی (Red Flags) و پروتکل مشاوره داروساز", "en": "Critical red flags requiring emergency or GP referral according to APF/PSA" }
- "type": "triage_redflag"`,
      calculation: `MODE: CLINICAL DOSING & PHARMACOKINETIC CALCULATIONS.
Focus on real-world calculations: eGFR/CrCl Cockcroft-Gault, Paediatric mg/kg, Opioid/Steroid Equivalence, Alligation/Infusion rates:
- "calculationFormula": { "fa": "فرمول و محاسبات گام به گام بالینی همراه با واحدها", "en": "Step-by-step clinical calculation formula with unit conversions" }
- "type": "calculation"`,
      cal_warning: `MODE: AUSTRALIAN CAUTIONARY ADVISORY LABELS (CALs & Safe Dispensing).
Focus on official Australian Cautionary Labels (e.g. Label 1, Label 2, Label 12, Label 13) and counseling points:
- "calLabels": ["Label 1", "Label 12"]
- "pearl": { "fa": "نکات مشاوره تحویل دارو و برچسب‌های هشدار الزامی استرالیا", "en": "Essential Australian CAL labels and patient counseling directives" }
- "type": "cal_warning"`,
      interaction: `MODE: CRITICAL DRUG INTERACTIONS & CONTRAINDICATIONS (AMH / eTG).
Focus on severe pharmacokinetic/pharmacodynamic interactions, CYP enzymes, and life-threatening contraindications:
- "pearl": { "fa": "مکانیسم تداخل، پیامد بالینی و مداخله اصلاحی داروساز", "en": "Interaction mechanism, clinical outcome, and pharmacist intervention pearl" }
- "type": "interaction"`,
      auto: `MODE: COMPREHENSIVE HIGH-YIELD CLINICAL MIX.
Generate a rich, balanced mix of therapeutic pearls, clinical scenarios, cautionary guidance, and high-yield decision points.`,
    };

    const specificModeInstruction = modeInstructionsMap[generationMode] || modeInstructionsMap.auto;

    const systemInstruction = `You are a Principal Clinical Pharmacist and Medical Educator in Australia specializing in Australian Pharmacy Standards (AMH, Therapeutic Guidelines eTG, APF 26, PBS, and SUSMP Scheduling).

CORE CLINICAL DIRECTIVES:
1. Ground all questions, answers, and clinical pearls strictly in modern Australian Clinical Pharmacy Practice (AMH, eTG, APF, PSA standards).
2. Use professional, natural, high-yield language. Avoid trivial dictionary questions; construct realistic diagnostic, therapeutic, dosing, interaction, and counseling challenges.
3. STRICT BILINGUAL REQUIREMENT: Every single flashcard MUST provide both fluent, natural Persian ('fa') and precise, medical English ('en') for questions, answers, pearls, and all options. Never leave either language blank.
4. DO NOT use generic test filler or placeholders. Provide concrete clinical mechanisms, drug names (TGA approved), and clear rationales.
5. STRICT JSON OUTPUT: Return ONLY a valid JSON object starting with { and ending with }.

${specificModeInstruction}

KNOWLEDGE TREE SPECIFICATION (5-Level Real Taxonomy):
- domain: { fa: "حوزه کلان داروسازی", en: "Knowledge Domain" }
- system: { fa: "سیستم فیزیولوژی یا مبحث کلان", en: "Organ System / Major Subject" }
- subsystem: { fa: "رده درمانی یا بیماری مشخص", en: "Therapeutic Class / Disease State" }
- subClass: { fa: "نام واقعی و تخصصی رده دارویی یا مولکول (مثلاً مهارکننده‌های SGLT2، بتا بلاکرها)", en: "Specific Drug Class / Molecule (e.g. SGLT2 Inhibitors, Beta-blockers)" }
- microTopic: { fa: "نکته تخصصی، تداخل یا مکانیسم بالینی دقیق", en: "Micro-Topic / Mechanism / Pitfall" }
- path: {
    fa: ["حوزه کلان", "سیستم", "رده درمانی", "رده دارویی واقعی", "نکته دقیق"],
    en: ["Domain", "System", "Class", "Specific SubClass", "Micro-Topic"]
  }

JSON STRUCTURE:
{
  "cards": [
    {
      "question": {
        "fa": "متن سناریو یا پرسش بالینی به فارسی دقیق و رسا",
        "en": "Clinical scenario or question in English"
      },
      "answer": {
        "fa": "پاسخ کامل، استدلال بالینی و نکات راهنمای درمانی به فارسی",
        "en": "Comprehensive clinical answer and rationale in English"
      },
      "pearl": {
        "fa": "نکته طلایی بالینی و کلیدی برای داروساز به فارسی",
        "en": "Key clinical pearl in English"
      },
      "type": "clinical_pearl",
      "category": "${category || 'Clinical Pharmacy'}",
      "topic": "${topic || 'Pharmacology'}",
      "module": ${moduleNumber},
      "mcqOptions": [
        { "id": "A", "text": { "fa": "گزینه اول", "en": "Option A" }, "isCorrect": true, "explanation": { "fa": "استدلال بالینی صحت گزینه", "en": "Clinical rationale" } },
        { "id": "B", "text": { "fa": "گزینه دوم", "en": "Option B" }, "isCorrect": false, "explanation": { "fa": "علت تمایز بالینی", "en": "Why incorrect" } },
        { "id": "C", "text": { "fa": "گزینه سوم", "en": "Option C" }, "isCorrect": false, "explanation": { "fa": "علت تمایز بالینی", "en": "Why incorrect" } },
        { "id": "D", "text": { "fa": "گزینه چهارم", "en": "Option D" }, "isCorrect": false, "explanation": { "fa": "علت تمایز بالینی", "en": "Why incorrect" } }
      ],
      "distractorRationale": {
        "fa": "تحلیل مقایسه‌ای و تمایز گزینه‌های انحرافی",
        "en": "Comparative analysis of distractor options"
      },
      "knowledgeTree": {
        "domain": { "fa": "${category || 'داروسازی بالینی استرالیا'}", "en": "${category || 'Australian Clinical Pharmacy'}" },
        "system": { "fa": "${topic || 'سیستم دارودرمانی'}", "en": "${topic || 'Pharmacotherapy System'}" },
        "subsystem": { "fa": "رده درمانی و بیماری‌ها", "en": "Therapeutic Class & Conditions" },
        "subClass": { "fa": "رده دارویی تخصصی", "en": "Specific Drug SubClass" },
        "microTopic": { "fa": "نکته بالینی و تداخل", "en": "Clinical Pearls & Safety" },
        "path": {
          "fa": ["${category || 'داروسازی بالینی استرالیا'}", "${topic || 'سیستم دارودرمانی'}", "رده درمانی و بیماری‌ها", "رده دارویی تخصصی", "نکته بالینی و تداخل"],
          "en": ["${category || 'Australian Clinical Pharmacy'}", "${topic || 'Pharmacotherapy System'}", "Therapeutic Class & Conditions", "Specific Drug SubClass", "Clinical Pearls & Safety"]
        }
      },
      "tags": ["${category || 'Clinical'}", "${topic || 'Pharmacy'}"]
    }
  ]
}`;

    const safeCustomPrompt = customPrompt ? String(customPrompt).slice(0, 1500).replace(/```/g, '') : '';
    const safeContextSnippet = contextSnippet ? String(contextSnippet).slice(0, 6000).replace(/```/g, '') : '';

    const prompt = `Topic: ${topic || 'Clinical Pharmacology'}
Category: ${category || 'Clinical Pharmacy'}
Module: Module ${moduleNumber} (${moduleName})
Target Flashcard Count: ${count}
${safeCustomPrompt ? `Custom User Directive / Special Instructions:\n${safeCustomPrompt}\n` : ''}
${safeContextSnippet ? `Clinical Source Reference / Selected Material:\n\`\`\`context\n${safeContextSnippet}\n\`\`\`` : ''}

Generate exactly ${count} high-yield, professionally formatted clinical flashcards in valid JSON matching the exact schema above.
Start your response directly with { and end with }.`;

    const rawOutput = await executeAiInference({
      provider,
      model,
      userApiKey: apiKey,
      prompt,
      systemInstruction,
      responseFormat: 'json',
      temperature: Math.min(0.3, Math.max(0.1, temperature || 0.2)),
    });

    let parsed: any;
    try {
      parsed = robustJsonParse(rawOutput);
    } catch (parseErr: any) {
      console.warn('First pass robust JSON parse failed, attempting raw text recovery...', parseErr);
      return NextResponse.json(
        { error: 'خطا در خواندن پاسخ هوش مصنوعی. لطفاً مجدداً امتحان کنید یا از مدل دیگری استفاده نمایید.', raw: rawOutput },
        { status: 500 }
      );
    }

    if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = { cards: parsed };
      } else {
        return NextResponse.json(
          { error: 'ساختار کارت‌های تولید شده توسط هوش مصنوعی معتبر نبود. لطفاً مجدداً امتحان کنید.', raw: rawOutput },
          { status: 500 }
        );
      }
    }

    // Normalize and safeguard all cards
    const safeCards = parsed.cards.map((c: any, idx: number) => {
      const qFa = typeof c.question === 'object' ? c.question?.fa || c.question?.en : String(c.question || '');
      const qEn = typeof c.question === 'object' ? c.question?.en || c.question?.fa : String(c.question || '');
      const aFa = typeof c.answer === 'object' ? c.answer?.fa || c.answer?.en : String(c.answer || '');
      const aEn = typeof c.answer === 'object' ? c.answer?.en || c.answer?.fa : String(c.answer || '');
      const pFa = typeof c.pearl === 'object' ? c.pearl?.fa || c.pearl?.en : String(c.pearl || '');
      const pEn = typeof c.pearl === 'object' ? c.pearl?.en || c.pearl?.fa : String(c.pearl || '');

      const kt = c.knowledgeTree || {};
      const ktDomainFa = kt.domain?.fa || c.category || category || 'داروسازی بالینی استرالیا';
      const ktDomainEn = kt.domain?.en || c.category || category || 'Australian Clinical Pharmacy';
      const ktSystemFa = kt.system?.fa || c.topic || topic || 'سیستم قلب و عروق';
      const ktSystemEn = kt.system?.en || c.topic || topic || 'Cardiovascular System';
      const ktSubsystemFa = kt.subsystem?.fa || kt.condition?.fa || 'داروهای قلبی و عروقی';
      const ktSubsystemEn = kt.subsystem?.en || kt.condition?.en || 'Cardiovascular Therapeutics';
      const ktSubClassFa = kt.subClass?.fa || kt.drugGroup?.fa || 'دسته‌بندی فارماکولوژی';
      const ktSubClassEn = kt.subClass?.en || kt.drugGroup?.en || 'Pharmacological Class';
      const ktMicroFa = kt.microTopic?.fa || kt.clinicalAspect?.fa || 'نکته بالینی و تله آزمون';
      const ktMicroEn = kt.microTopic?.en || kt.clinicalAspect?.en || 'Clinical Focus & Pitfall';

      const ktPathFa = Array.isArray(kt.path?.fa) && kt.path.fa.length >= 4
        ? kt.path.fa
        : [ktDomainFa, ktSystemFa, ktSubsystemFa, ktSubClassFa, ktMicroFa];
      const ktPathEn = Array.isArray(kt.path?.en) && kt.path.en.length >= 4
        ? kt.path.en
        : [ktDomainEn, ktSystemEn, ktSubsystemEn, ktSubClassEn, ktMicroEn];

      return {
        question: { fa: qFa || `پرسش بالینی ${idx + 1}`, en: qEn || `Clinical Question ${idx + 1}` },
        answer: { fa: aFa || `پاسخ تشریحی ${idx + 1}`, en: aEn || `Detailed Answer ${idx + 1}` },
        pearl: { fa: pFa, en: pEn },
        type: c.type || 'clinical_pearl',
        category: c.category || category || 'Clinical Pharmacy',
        topic: c.topic || topic || 'Pharmacology',
        module: moduleNumber,
        mcqOptions: Array.isArray(c.mcqOptions) ? c.mcqOptions : undefined,
        distractorRationale: c.distractorRationale || undefined,
        calculationFormula: c.calculationFormula || undefined,
        calLabels: Array.isArray(c.calLabels) ? c.calLabels : undefined,
        triageOutcome: c.triageOutcome || undefined,
        knowledgeTree: {
          domain: { fa: ktDomainFa, en: ktDomainEn },
          system: { fa: ktSystemFa, en: ktSystemEn },
          subsystem: { fa: ktSubsystemFa, en: ktSubsystemEn },
          condition: { fa: ktSubsystemFa, en: ktSubsystemEn },
          subClass: { fa: ktSubClassFa, en: ktSubClassEn },
          drugGroup: { fa: ktSubClassFa, en: ktSubClassEn },
          microTopic: { fa: ktMicroFa, en: ktMicroEn },
          clinicalAspect: { fa: ktMicroFa, en: ktMicroEn },
          path: { fa: ktPathFa, en: ktPathEn },
        },
        tags: Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : [category, topic],
        sourceSnippet: contextSnippet || c.sourceSnippet || undefined,
      };
    });

    return NextResponse.json({ cards: safeCards });
  } catch (error: any) {
    console.error('Error generating Leitner flashcards:', error);
    return NextResponse.json(
      { error: error?.message || 'خطا در ارتباط با سرویس هوش مصنوعی' },
      { status: 500 }
    );
  }
}
