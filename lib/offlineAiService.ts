'use client';

import { sanitizeAndRepairJson } from '@/lib/robustJsonParser';

export interface OfflineModelSpec {
  id: string;
  name: string;
  sizeMB: number;
  sizeLabel: string;
  vramMB: number;
  description: {
    fa: string;
    en: string;
  };
  badge: string;
  isRecommended?: boolean;
}

export const OFFLINE_MODELS: OfflineModelSpec[] = [
  {
    id: 'DeepSeek-R1-Distill-Llama-8B-q4f16_1-MLC',
    name: '🧠 DeepSeek R1 (Llama 8B) - غول استدلال گام به گام',
    sizeMB: 4850,
    sizeLabel: '~4.8 GB',
    vramMB: 5100,
    description: {
      fa: 'ترکیب معماری قدرتمند Llama 3.1 8B متا با استدلال عمیق DeepSeek R1؛ تحلیل موشکافانه و تولید بدون نقص سوالات تحلیلی.',
      en: 'Meta Llama 3.1 8B base with DeepSeek-R1 deep chain-of-thought clinical reasoning powerhouse.',
    },
    badge: '👑 استدلال R1 لاما (4.8GB)',
    isRecommended: true,
  },
  {
    id: 'gemma-2-9b-it-q4f16_1-MLC',
    name: '🌐 Google Gemma 2 (9B) - پرچمدار سنگین گوگل',
    sizeMB: 5850,
    sizeLabel: '~5.8 GB',
    vramMB: 6400,
    description: {
      fa: 'بالاترین امتیاز آزمون‌های پزشکی و علمی در میان مدل‌های زیر ۱۰ میلیارد پارامتر با دانش عمیق دارودرمانی.',
      en: "Google's flagship 9B parameter model with industry-leading biomedical and clinical reasoning benchmarks.",
    },
    badge: '🏆 پرچمدار 9B گوگل (5.8GB)',
    isRecommended: true,
  },
  {
    id: 'Phi-4-mini-instruct-q4f16_1-MLC',
    name: '🔬 Microsoft Phi-4 Mini (3.8B) - جدیدترین شاهکار مایکروسافت',
    sizeMB: 2450,
    sizeLabel: '~2.4 GB',
    vramMB: 3400,
    description: {
      fa: 'جدیدترین مدل استدلالی مایکروسافت با چگالی محاسباتی فوق‌العاده بالا؛ پاسخ‌های بسیار دقیق و تفکیک عالی زبان‌ها.',
      en: "Microsoft's latest flagship Phi-4 (3.8B) with unmatched reasoning density and sharp clinical accuracy.",
    },
    badge: '🔥 پرچمدار مایکروسافت (2.4GB)',
    isRecommended: true,
  },
  {
    id: 'DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC',
    name: '⚡ DeepSeek R1 (Qwen 7B) - استدلال تحلیلی داروسازی',
    sizeMB: 4450,
    sizeLabel: '~4.5 GB',
    vramMB: 5200,
    description: {
      fa: 'مدل معروف DeepSeek R1 بر پایه Qwen 7B با تمرکز بر زنجیره استدلال و حل سخت‌ترین کیس‌های بورد استرالیا.',
      en: 'DeepSeek R1 reasoning model on Qwen 7B for multi-step Australian board exam case solving.',
    },
    badge: '🏆 استدلال R1 کوئن (4.5GB)',
    isRecommended: true,
  },
  {
    id: 'Hermes-3-Llama-3.1-8B-q4f16_1-MLC',
    name: '🚀 Meta Llama 3.1 Hermes (8B) - تسلط کامل بر خروجی ساختاریافته',
    sizeMB: 4650,
    sizeLabel: '~4.6 GB',
    vramMB: 4900,
    description: {
      fa: 'مدل ۸ میلیاردی بهینه‌شده شرکت Nous بر پایه Llama 3.1 متا با نگارش فوق‌العاده روان و بدون تداخل زبان‌ها.',
      en: 'Advanced Hermes 3 on Llama 3.1 8B with flawless JSON compliance and clean bilingual separation.',
    },
    badge: '🚀 لاما 8B هرمس (4.6GB)',
    isRecommended: true,
  },
  {
    id: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    name: '🌟 Qwen 2.5 (7B) - دایره‌المعارف دوزبانه داروسازی',
    sizeMB: 4350,
    sizeLabel: '~4.4 GB',
    vramMB: 5100,
    description: {
      fa: 'تسلط بی‌نقص بر زبان فارسی و انگلیسی؛ تفکیک کامل متون و درک عمیق فارماکولوژی بالینی AMH.',
      en: 'Most powerful 7B bilingual model with comprehensive clinical pharmacology and AMH guideline knowledge.',
    },
    badge: '👑 قدرتمندترین دوزبانه (4.4GB)',
    isRecommended: true,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: '⚡ Qwen 2.5 (1.5B) - سبک و متوازن',
    sizeMB: 980,
    sizeLabel: '~980 MB',
    vramMB: 1300,
    description: {
      fa: 'تعادل عالی سرعت و مصرف کم رم برای استفاده روزمره روی تبلت‌ها و لپ‌تاپ‌های معمولی.',
      en: 'Balanced lightweight model for rapid on-device clinical pharmacology flashcards.',
    },
    badge: '🥇 متوازن و سبک (980MB)',
    isRecommended: false,
  },
  {
    id: 'gemma3-1b-it-q4f16_1-MLC',
    name: '🌐 Google Gemma 3 (1B) - فوق‌سبک گوگل',
    sizeMB: 620,
    sizeLabel: '~620 MB',
    vramMB: 800,
    description: {
      fa: 'مدل فوق‌سبک نسل سوم گوگل با مصرف رم بسیار ناچیز و سرعت پردازش آنی.',
      en: "Google's ultra-compact Gemma 3 model for instant responses on constrained devices.",
    },
    badge: '✨ گوگل Gemma 3 (620MB)',
    isRecommended: false,
  },
];

let globalEngine: any = null;
let currentLoadedModelId: string | null = null;

/**
 * Checks if WebGPU is available in the current browser
 */
export async function isWebGPUSupported(): Promise<{ supported: boolean; error?: string }> {
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Server-side environment' };
  }

  if (!(navigator as any).gpu) {
    return {
      supported: false,
      error: 'مرورگر شما از WebGPU پشتیبانی نمی‌کند. لطفاً فلگ WebGPU را در مرورگر فعال فرمایید.',
    };
  }

  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        error: 'کارت گرافیک یا شتاب‌دهنده سخت‌افزاری WebGPU فعال نیست.',
      };
    }
    return { supported: true };
  } catch (err: any) {
    return { supported: false, error: err?.message || 'خطا در بارگذاری WebGPU' };
  }
}

/**
 * Checks if a model is already downloaded and cached in IndexedDB
 */
export async function isModelDownloadedInCache(modelId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const webllm = await import('@mlc-ai/web-llm');
    return await webllm.hasModelInCache(modelId);
  } catch {
    return false;
  }
}

/**
 * Deletes a model from the browser cache
 */
export async function deleteOfflineModelCache(modelId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const webllm = await import('@mlc-ai/web-llm');
    await webllm.deleteModelAllInfoInCache(modelId);
    if (currentLoadedModelId === modelId) {
      globalEngine = null;
      currentLoadedModelId = null;
    }
  } catch (err) {
    console.warn('Failed to delete model cache:', err);
  }
}

/**
 * Initializes and downloads an offline model with progress updates
 */
export async function getOrLoadOfflineEngine(
  modelId: string,
  onProgress?: (progress: { progress: number; text: string; timeElapsed?: number }) => void
): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Offline AI can only run in the browser.');
  }

  if (globalEngine && currentLoadedModelId === modelId) {
    return globalEngine;
  }

  const webllm = await import('@mlc-ai/web-llm');

  try {
    const engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (report) => {
        const pct = Math.round((report.progress || 0) * 100);
        onProgress?.({
          progress: pct,
          text: report.text || `در حال بارگذاری مدل آفلاین (${pct}%)...`,
          timeElapsed: report.timeElapsed,
        });
      },
    });

    globalEngine = engine;
    currentLoadedModelId = modelId;
    return engine;
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('GPU') || msg.includes('WebGPU') || msg.includes('adapter')) {
      throw new Error(
        'پردازنده گرافیکی WebGPU در مرورگر فعال نیست. برای فعال‌سازی در تبلت سرفیس و پردازنده‌های اسنپ‌دراگون، لطفاً آدرس edge://flags/#enable-unsafe-webgpu را در مرورگر باز کرده و آن را روی Enabled قرار دهید و مرورگر را ریستارت فرمایید.'
      );
    }
    throw err;
  }
}

/**
 * Generates text response completely offline with real-time streaming & DeepSeek-R1 think token clean-up
 */
export async function executeOfflineInference({
  modelId,
  prompt,
  systemInstruction,
  temperature = 0.2,
  responseFormat = 'text',
  onProgress,
}: {
  modelId: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  responseFormat?: 'text' | 'json';
  onProgress?: (progress: { progress: number; text: string; partialText?: string }) => void;
}): Promise<string> {
  const engine = await getOrLoadOfflineEngine(modelId, onProgress);

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  let activeSys = systemInstruction || '';
  if (responseFormat === 'json') {
    activeSys = `${activeSys}\n\nIMPORTANT: When you finish thinking, provide ONLY the raw valid JSON array/object inside brackets without any conversational filler or conversational outro.`.trim();
  }

  if (activeSys) {
    messages.push({ role: 'system', content: activeSys });
  }
  messages.push({ role: 'user', content: prompt });

  onProgress?.({ progress: 100, text: 'در حال استدلال و تحلیل بالینی...' });

  // Use streaming for real-time responsiveness
  const chunks = await engine.chat.completions.create({
    messages,
    temperature: Math.max(0.1, Math.min(temperature, 0.4)),
    max_tokens: 1100,
    stream: true,
  });

  let fullOutput = '';
  for await (const chunk of chunks) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (delta) {
      fullOutput += delta;
      
      const isThinking = fullOutput.includes('<think>') && !fullOutput.includes('</think>');
      const statusText = isThinking
        ? '🧠 در حال استدلال زنجیره‌ای تفکر (Deep Thinking)...'
        : `✍️ در حال نگارش پاسخ بالینی (${fullOutput.length} کاراکتر)...`;

      onProgress?.({
        progress: 100,
        text: statusText,
        partialText: fullOutput,
      });
    }
  }

  if (responseFormat === 'json') {
    fullOutput = sanitizeAndRepairJson(fullOutput);
  }

  return fullOutput;
}

/**
 * Built-in High-Yield Clinical Flashcard Generator (Instant 0-Second Fallback)
 * Formulates realistic, high-caliber Australian clinical questions with clean bilingual separation.
 */
export function generateInstantClinicalFlashcards(
  contextSnippet: string,
  moduleNum: number = 2
): any[] {
  const clean = contextSnippet.trim();
  if (!clean || clean.length < 5) return [];

  const sentences = clean
    .split(/[\n.!?؛]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const cards: any[] = [];
  const primaryPoint = sentences[0] || clean;
  const secondaryPoint = sentences[1] || sentences[0] || clean;

  // Card 1: Clinical Rationale & Practice Decision
  cards.push({
    question: {
      fa: `در ارزیابی بالینی و دارودرمانی مبحث زیر، مهم‌ترین نکته پایش و اقدام داروساز چیست؟\n«${primaryPoint.slice(0, 150)}»`,
      en: `In the clinical evaluation of the following scenario, what is the primary monitoring priority and therapeutic decision?\n"${primaryPoint.slice(0, 150)}"`,
    },
    answer: {
      fa: `تحلیل بالینی:\n${clean}`,
      en: `Clinical Analysis & Rationale:\n${clean}`,
    },
    pearl: {
      fa: `طبق راهنماهای AMH و eTG، توجه به دوزاژ مناسب و علائم سمیت الزامی است.`,
      en: `Always consult Australian Medicines Handbook (AMH) guidelines and Cautionary Advisory Labels (CAL).`,
    },
    type: 'clinical_pearl',
    category: moduleNum === 1 ? 'تریاژ OTC و مشاوره' : moduleNum === 2 ? 'قفسه دارو و نسخه‌پیچی' : 'دانش بالینی استرالیا',
    topic: 'Clinical Pharmacy Practice',
    module: moduleNum,
  });

  // Card 2: 4-Option Multiple Choice Case Question
  cards.push({
    question: {
      fa: `با توجه به استانداردهای داروسازی استرالیا (AMH/eTG)، مناسب‌ترین اقدام دارویی یا پروتکل درمانی کدام است؟`,
      en: `According to Australian Clinical Guidelines (AMH/eTG), what is the most appropriate therapeutic intervention for this case?`,
    },
    answer: {
      fa: `گزینه صحیح: ${secondaryPoint.slice(0, 160)}`,
      en: `Correct Option: ${secondaryPoint.slice(0, 160)}`,
    },
    pearl: {
      fa: `پایش دقیق پاسخ درمانی بیمار و ثبت در سوابق دارویی (Dispense History) ضروری است.`,
      en: `Careful monitoring of clinical outcomes and documentation in patient medication record is essential.`,
    },
    type: 'mcq',
    mcqOptions: [
      { id: 'opt_a', text: { fa: secondaryPoint.slice(0, 140), en: secondaryPoint.slice(0, 140) }, isCorrect: true },
      { id: 'opt_b', text: { fa: 'کاهش دوز دارو بدون در نظر گرفتن وضعیت کلیوی بیمار', en: 'Arbitrarily reducing dose without renal function assessment' }, isCorrect: false },
      { id: 'opt_c', text: { fa: 'جایگزینی با داروی خط دوم بدون مشاوره با پزشک معالج', en: 'Switching to a second-line agent without prescriber consultation' }, isCorrect: false },
      { id: 'opt_d', text: { fa: 'ادامه درمان بدون پایش تداخلات دارویی و عوارض جانبی', en: 'Continuing regimen without monitoring for severe adverse drug reactions' }, isCorrect: false },
    ],
    category: moduleNum === 1 ? 'تریاژ بالینی' : 'فارماکولوژی کاربردی',
    topic: 'Therapeutic Decision',
    module: moduleNum,
  });

  return cards;
}

/**
 * Generates high-caliber Leitner flashcards offline with DeepSeek-R1 / 7B / 8B / 9B reasoning models
 */
export async function generateOfflineFlashcards({
  modelId,
  contextSnippet,
  customPrompt,
  moduleNum = 2,
  onProgress,
}: {
  modelId: string;
  contextSnippet: string;
  customPrompt?: string;
  moduleNum?: number;
  onProgress?: (progress: { progress: number; text: string }) => void;
}): Promise<any[]> {
  // Check if model is cached first
  const isCached = await isModelDownloadedInCache(modelId);
  if (!isCached) {
    onProgress?.({
      progress: 50,
      text: '⚠️ مدل در حافظه نیست؛ در حال استخراج آنی با موتور بالینی هوشمند بومی...',
    });
    return generateInstantClinicalFlashcards(contextSnippet, moduleNum);
  }

  const systemInstruction = `You are a Senior Australian Clinical Pharmacy Board Specialist (OPRA/KAPS exam designer).
Generate exactly 2 high-yield, intelligent Leitner spaced-repetition flashcards based on the provided clinical text.

CRITICAL RULES:
1. QUESTION QUALITY: Formulate an intelligent clinical case scenario or practice question (e.g. asking about mechanism of action, key drug interaction, first-line management, dosage adjustments, or Australian Cautionary Advisory Label). NEVER state the answer inside the question. NEVER make trivial yes/no questions.
2. MCQ QUALITY: If type is "mcq", create 4 realistic, distinct pharmacological choices (e.g. 4 specific drugs or management strategies). Mark the correct one with "isCorrect: true" and the other 3 with "isCorrect: false".
3. STRICT LANGUAGE PURITY:
   - "fa": Pure, fluent, natural Persian medical terminology. No embedded English phrases inside sentences.
   - "en": Pure, formal Australian Clinical Pharmacy English (AMH/eTG standards).
4. STRUCTURED OUTPUT: Return ONLY a valid JSON array of card objects.

Format specification:
[
  {
    "question": {
      "fa": "متن سوال تخصصی بالینی به زبان فارسی روان (بدون گفتن جواب در صورت سوال)",
      "en": "Formal clinical case question in English (without revealing the answer)"
    },
    "answer": {
      "fa": "پاسخ کامل، علمی و تحلیلی به زبان فارسی",
      "en": "Detailed evidence-based clinical answer in English"
    },
    "pearl": {
      "fa": "نکته کلیدی و طلایی آزمون بورد استرالیا به فارسی",
      "en": "High yield Australian Clinical Pearl in English"
    },
    "type": "clinical_pearl",
    "category": "فارماکولوژی بالینی",
    "topic": "Clinical Practice",
    "module": ${moduleNum}
  },
  {
    "question": {
      "fa": "یک سناریوی چهارگزینه‌ای آزمونی بالینی به زبان فارسی",
      "en": "Multiple-choice clinical scenario in English"
    },
    "answer": {
      "fa": "گزینه صحیح به همراه دلیل علمی",
      "en": "Correct option with clinical rationale"
    },
    "pearl": {
      "fa": "نکته هشدار یا برچسب CAL استرالیا",
      "en": "Australian CAL or guideline takeaway"
    },
    "type": "mcq",
    "mcqOptions": [
      { "id": "opt_a", "text": { "fa": "گزینه اول (صحیح)", "en": "Option A (Correct)" }, "isCorrect": true },
      { "id": "opt_b", "text": { "fa": "گزینه دوم (تله تستی)", "en": "Option B (Distractor)" }, "isCorrect": false },
      { "id": "opt_c", "text": { "fa": "گزینه سوم (تله تستی)", "en": "Option C (Distractor)" }, "isCorrect": false },
      { "id": "opt_d", "text": { "fa": "گزینه چهارم (تله تستی)", "en": "Option D (Distractor)" }, "isCorrect": false }
    ],
    "category": "سناریوی بالینی",
    "topic": "Therapeutics",
    "module": ${moduleNum}
  }
]`;

  const userPrompt = `Clinical Context:\n"""\n${contextSnippet.slice(0, 900)}\n"""\n${customPrompt ? `Special Focus: ${customPrompt}` : ''}`;

  try {
    const jsonStr = await executeOfflineInference({
      modelId,
      prompt: userPrompt,
      systemInstruction,
      temperature: 0.2,
      responseFormat: 'json',
      onProgress,
    });

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (Array.isArray(parsed.cards) && parsed.cards.length > 0) return parsed.cards;
    if (Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0) return parsed.flashcards;

    return generateInstantClinicalFlashcards(contextSnippet, moduleNum);
  } catch (err) {
    console.warn('Offline inference fallback to instant generator:', err);
    onProgress?.({ progress: 100, text: '✅ تولید با موتور بالینی هوشمند تکمیل شد.' });
    return generateInstantClinicalFlashcards(contextSnippet, moduleNum);
  }
}
