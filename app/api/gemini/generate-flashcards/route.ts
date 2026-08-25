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
      mcq: `MODE: MULTIPLE-CHOICE CLINICAL QUESTIONS.
Generate 4-option clinical MCQ scenarios with:
- "mcqOptions": array of 4 options [{ "id": "A", "text": { "fa": "...", "en": "..." }, "isCorrect": true/false, "explanation": { "fa": "...", "en": "..." } }]. EXACTLY ONE option must have isCorrect: true.
- "distractorRationale": { "fa": "نکات تفکیک تشخیصی و علت تمایز سایر گزینه‌ها به صورت نکته بالینی", "en": "Clinical rationale explaining why other choices are inappropriate" }.
- "type": "mcq"`,
      triage_redflag: `MODE: OTC TRIAGE & RED FLAGS (Primary Healthcare Decision).
Generate clinical triage cases asking whether to supply OTC medicine or refer:
- "triageOutcome": "supply_otc" | "urgent_referral" | "gp_referral"
- "pearl": { "fa": "علائم هشداردهنده و رد فلگ‌های حیاتی (Red Flags)", "en": "Critical red flags requiring emergency or specialist referral" }
- "type": "triage_redflag"`,
      calculation: `MODE: CLINICAL DOSING & PHARMACOKINETIC CALCULATIONS (eGFR, CrCl Cockcroft-Gault, Paediatric mg/kg, Opioid/Steroid Conversions).
- "calculationFormula": { "fa": "فرمول و محاسبات بالینی به صورت نکته گام به گام", "en": "Step-by-step clinical calculation formula and workings" }
- "type": "calculation"`,
      cal_warning: `MODE: CAUTIONARY ADVISORY LABELS (CALs & Safe Dispensing Guidelines).
Focus on essential cautionary labels and safe dispensing rules:
- "calLabels": ["Label 1", "Label 12"]
- "type": "cal_warning"`,
      interaction: `MODE: CRITICAL DRUG INTERACTIONS & CONTRAINDICATIONS (AMH / eTG).
Focus on severe interactions, contraindications, and therapeutic points:
- "pearl": { "fa": "مکانیسم تداخل و نکته کلیدی مداخله داروساز", "en": "Interaction mechanism and clinical pharmacist intervention pearl" }
- "type": "interaction"`,
      auto: `MODE: COMPREHENSIVE BALANCED MIX.
Generate a high-yield mix of key clinical points, structured MCQs, triage red-flags, and cautionary guidance.`,
    };

    const specificModeInstruction = modeInstructionsMap[generationMode] || modeInstructionsMap.auto;

    const systemInstruction = `You are a Senior Clinical Pharmacist and Medical Educator specializing in high-yield pharmacotherapy, therapeutics, and patient safety guidelines (AMH, eTG, APF).

CRITICAL INSTRUCTIONS:
1. Express all concepts, questions, and explanations as practical, high-yield clinical points / pearls (نکات طلایی و کاربردی داروسازی بالینی).
2. DO NOT use repetitive exam labels like "OPRA", "KAPS", "تله آزمون OPRA", or test jargon. Instead, present information as practical diagnostic clues, medication safety points, drug interaction pearls, and clinical counseling rules.
3. You MUST respond with ONLY a valid, parseable JSON object.
4. Escape all double quotes inside text values with \\" and do not include trailing commas.
5. STRICT BILINGUAL REQUIREMENT: Every single flashcard MUST provide both rich, accurate Persian ('fa') text AND professional clinical English ('en') text for question, answer, pearl, rationale, and all options. Both languages must be filled in with high clinical quality.

${specificModeInstruction}

KNOWLEDGE TREE REQUIREMENT (درخت دانش عمیق ۵ لایه‌ای + سوال به عنوان لایه ۶):
Include a 5-level hierarchical knowledge tree in every card:
- domain: { fa: "حوزه کلان", en: "Root Domain" }
- system: { fa: "سیستم یا مبحث کلان", en: "Organ System / Chapter" }
- subsystem: { fa: "رده درمانی یا وضعیت بیماری", en: "Therapeutic Class / Condition" }
- subClass: { fa: "نام واقعی و دقیق رده دارویی یا مولکول مشخص (مثلاً مهارکننده‌های SGLT2، استاتین‌ها)", en: "Specific Drug Class / Molecule (e.g. SGLT2 Inhibitors, Statins)" }
- microTopic: { fa: "مفهوم دقیق بالینی، عارضه یا تله تشخیصی مشخص", en: "Specific Clinical Point / Mechanism / Pitfall" }
- path: {
    fa: ["حوزه کلان", "سیستم کلان", "رده درمانی", "زیررده دارویی مشخص", "مفهوم دقیق"],
    en: ["Domain", "System", "Class", "Specific Sub-Class", "Micro-Topic"]
  }

CRITICAL RULES FOR NAMING:
- For subClass: ALWAYS use real, specific medical/pharmacological names (e.g., 'مهارکننده‌های SGLT2', 'مسدودکننده‌های کانال کلسیم', 'استاتین‌ها', 'پروتکل تریاژ سرفه'). NEVER generate generic numeric placeholders like 'زیر رده دارویی ۱' or 'Pharmacology 2'.
- If there is no specific subClass, use the real condition name rather than generic numbers.

EXACT REQUIRED JSON SCHEMA:
{
  "cards": [
    {
      "question": {
        "fa": "پرسش یا سناریوی بالینی به فارسی دقیق و رسا",
        "en": "Clinical question or scenario in English"
      },
      "answer": {
        "fa": "پاسخ کامل، استدلال بالینی و راهنمای درمانی به صورت نکته فارسی",
        "en": "Detailed clinical answer and rationale in English"
      },
      "pearl": {
        "fa": "نکته طلایی و کلیدی بالینی به فارسی",
        "en": "Key clinical pearl in English"
      },
      "type": "clinical_pearl",
      "category": "${category || 'Clinical Pharmacy'}",
      "topic": "${topic || 'Pharmacology'}",
      "module": ${moduleNumber},
      "mcqOptions": [
        { "id": "A", "text": { "fa": "گزینه اول", "en": "Option A" }, "isCorrect": true, "explanation": { "fa": "نکته درستی گزینه", "en": "Explanation" } },
        { "id": "B", "text": { "fa": "گزینه دوم", "en": "Option B" }, "isCorrect": false, "explanation": { "fa": "علت تمایز", "en": "Clinical distinction" } },
        { "id": "C", "text": { "fa": "گزینه سوم", "en": "Option C" }, "isCorrect": false, "explanation": { "fa": "علت تمایز", "en": "Clinical distinction" } },
        { "id": "D", "text": { "fa": "گزینه چهارم", "en": "Option D" }, "isCorrect": false, "explanation": { "fa": "علت تمایز", "en": "Clinical distinction" } }
      ],
      "distractorRationale": {
        "fa": "نکات تشخیصی و تمایز گزینه‌ها",
        "en": "Clinical distinctions among options"
      },
      "knowledgeTree": {
        "domain": { "fa": "${category || 'داروسازی بالینی استرالیا'}", "en": "${category || 'Australian Clinical Pharmacy'}" },
        "system": { "fa": "${topic || 'سیستم قلب و عروق'}", "en": "${topic || 'Cardiovascular System'}" },
        "subsystem": { "fa": "داروهای فشار خون و نارسایی قلبی", "en": "Antihypertensives & Heart Failure" },
        "subClass": { "fa": "مهارکننده‌های رنین-آنژیوتانسین (ACEi / ARB)", "en": "RAAS Inhibitors (ACEi / ARB)" },
        "microTopic": { "fa": "عوارض برادی‌کینین و تله‌های بالینی", "en": "Bradykinin Complications & Clinical Traps" },
        "path": {
          "fa": ["${category || 'داروسازی بالینی استرالیا'}", "${topic || 'سیستم قلب و عروق'}", "داروهای فشار خون و نارسایی قلبی", "مهارکننده‌های رنین-آنژیوتانسین (ACEi / ARB)", "عوارض برادی‌کینین و تله‌های بالینی"],
          "en": ["${category || 'Australian Clinical Pharmacy'}", "${topic || 'Cardiovascular System'}", "Antihypertensives & Heart Failure", "RAAS Inhibitors (ACEi / ARB)", "Bradykinin Complications & Clinical Traps"]
        }
      },
      "tags": ["${category || 'Clinical'}", "${topic || 'Pharmacy'}"]
    }
  ]
}`;

    const safeCustomPrompt = customPrompt ? String(customPrompt).slice(0, 1000).replace(/```/g, '') : '';
    const safeContextSnippet = contextSnippet ? String(contextSnippet).slice(0, 5000).replace(/```/g, '') : '';

    const prompt = `Topic: ${topic || 'Clinical Pharmacology'}
Category: ${category || 'Clinical Pharmacy'}
Module: Module ${moduleNumber} (${moduleName})
Target Card Count: ${count}
${safeCustomPrompt ? `Custom User Directive: ${safeCustomPrompt}\n` : ''}
${safeContextSnippet ? `Reference Clinical Content / Selected Context:\n\`\`\`context\n${safeContextSnippet}\n\`\`\`` : ''}

Generate exactly ${count} high-yield flashcards in valid JSON matching the exact schema above.
Begin your response directly with { and end with }.`;

    const rawOutput = await executeAiInference({
      provider,
      model,
      userApiKey: apiKey,
      prompt,
      systemInstruction,
      responseFormat: 'json',
      temperature,
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
      // If the model returned an array directly without "cards" wrapper
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = { cards: parsed };
      } else {
        return NextResponse.json(
          { error: 'هیچ کارتی توسط هوش مصنوعی تولید نشد.', raw: rawOutput },
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
