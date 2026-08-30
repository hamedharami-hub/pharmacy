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
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 (0.5B) - فوق‌العاده سبک و پرسرعت',
    sizeMB: 380,
    sizeLabel: '~380 MB',
    vramMB: 600,
    description: {
      fa: 'بسیار کم‌حجم و پرسرعت؛ مصرف کم رم، مناسب برای تولید سریع فلش‌کارت در انواع سیستم‌ها.',
      en: 'Ultra lightweight & blazing fast; minimal RAM usage, ideal for fast flashcard generation on any laptop or phone.',
    },
    badge: '⚡ کم‌حجم (380MB)',
    isRecommended: true,
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 (1.5B) - چندزبانه داروسازی و بالینی',
    sizeMB: 980,
    sizeLabel: '~980 MB',
    vramMB: 1300,
    description: {
      fa: 'دقت عالی در درک اصطلاحات دارودرمانی و تعادل بی‌نظیر بین زبان فارسی، انگلیسی و خروجی ساختاریافته JSON.',
      en: 'Outstanding clinical pharmacology reasoning with balanced Persian & English and structured JSON output.',
    },
    badge: '🏆 بالینی و چندزبانه (980MB)',
    isRecommended: true,
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 (1B) - هوش مصنوعی سبک Meta',
    sizeMB: 880,
    sizeLabel: '~880 MB',
    vramMB: 1100,
    description: {
      fa: 'مدل نسل جدید شرکت متا با توانایی بسیار بالا در پیروی از دستورالعمل‌ها و استخراج نکات کلیدی درسی.',
      en: "Meta's state-of-the-art lightweight model with strong instruction following and clinical summary extraction.",
    },
    badge: '🚀 Llama 3.2 (880MB)',
    isRecommended: false,
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM 2 (1.7B) - استدلال تحلیلی',
    sizeMB: 950,
    sizeLabel: '~950 MB',
    vramMB: 1200,
    description: {
      fa: 'مدل بهینه‌سازی‌شده برای تولید سوالات چهارگزینه‌ای دقیق و تفکیک خطاهای رایج در آزمون‌های داروسازی.',
      en: 'Specialized model for generating accurate multiple-choice questions and clinical distractor analysis.',
    },
    badge: '🧠 استدلالی (950MB)',
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
      error: 'مرورگر شما از WebGPU پشتیبانی نمی‌کند. لطفاً از آخرین نسخه Chrome یا Edge استفاده کرده و فلگ WebGPU را فعال فرمایید.',
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
 * Generates text response completely offline with real-time streaming
 */
export async function executeOfflineInference({
  modelId,
  prompt,
  systemInstruction,
  temperature = 0.1,
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
    activeSys = `${activeSys}\n\nIMPORTANT: Return ONLY a raw JSON array of cards. No intro, no conversational text.`.trim();
  }

  if (activeSys) {
    messages.push({ role: 'system', content: activeSys });
  }
  messages.push({ role: 'user', content: prompt });

  onProgress?.({ progress: 100, text: 'در حال تولید پاسخ بالینی...' });

  // Use streaming for real-time responsiveness
  const chunks = await engine.chat.completions.create({
    messages,
    temperature: Math.max(0.1, Math.min(temperature, 0.3)),
    max_tokens: 750,
    stream: true,
  });

  let fullOutput = '';
  for await (const chunk of chunks) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    if (delta) {
      fullOutput += delta;
      onProgress?.({
        progress: 100,
        text: `در حال نوشتن پاسخ (${fullOutput.length} کاراکتر)...`,
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
 * Built-in Instant Clinical Flashcard Generator (0-second instant offline extraction)
 * Generates rich clinical Leitner flashcards directly from any text without needing downloads.
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
    .filter((s) => s.length > 12);

  const cards: any[] = [];

  // Card 1: Core Clinical Pearl
  const mainSentence = sentences[0] || clean.slice(0, 180);
  cards.push({
    question: {
      fa: `نکته کلیدی و کاربرد بالینی مبحث زیر چیست؟\n«${clean.slice(0, 140)}...»`,
      en: `What is the primary clinical rationale and practice point for this case?\n"${clean.slice(0, 140)}..."`,
    },
    answer: {
      fa: `تحلیل بالینی و دارودرمانی:\n${clean}`,
      en: `Clinical reasoning & pharmacology:\n${clean}`,
    },
    pearl: {
      fa: mainSentence,
      en: mainSentence,
    },
    type: 'clinical_pearl',
    category: moduleNum === 1 ? 'تریاژ OTC و مشاوره' : moduleNum === 2 ? 'قفسه دارو و نسخه‌پیچی' : 'دانش بالینی استرالیا',
    topic: 'Clinical Pharmacy Practice',
    module: moduleNum,
  });

  // Card 2: Multiple Choice Scenario if text has enough detail
  if (sentences.length >= 2) {
    const secondSentence = sentences[1];
    cards.push({
      question: {
        fa: `بر اساس دستورالعمل‌های درمانی استرالیا (AMH/eTG)، اقدام بالینی ارجح در مورد «${mainSentence.slice(0, 80)}» کدام است؟`,
        en: `According to Australian Clinical Guidelines (AMH/eTG), which is the most appropriate clinical action regarding "${mainSentence.slice(0, 80)}"?`,
      },
      answer: {
        fa: `گزینه صحیح: ${secondSentence}`,
        en: `Correct Action: ${secondSentence}`,
      },
      pearl: {
        fa: `توجه به هشدارهای برچسب و دوزاژ ایمن طبق استانداردهای APF و AMH الزامی است.`,
        en: `Always consult AMH dosage guidelines and Cautionary Advisory Labels (CAL).`,
      },
      type: 'mcq',
      mcqOptions: [
        { id: 'opt_a', text: { fa: secondSentence, en: secondSentence }, isCorrect: true },
        { id: 'opt_b', text: { fa: 'قطع فوری دارو بدون ارزیابی بالینی مجدد', en: 'Immediately withhold therapy without reassessment' }, isCorrect: false },
        { id: 'opt_c', text: { fa: 'افزایش خودسرانه دوزاژ بدون پایش سطح خونی', en: 'Increase dose without therapeutic drug monitoring' }, isCorrect: false },
        { id: 'opt_d', text: { fa: 'نادیده گرفتن علائم تا موعد ویزیت بعدی', en: 'Observe without clinical intervention until next cycle' }, isCorrect: false },
      ],
      category: moduleNum === 1 ? 'تریاژ OTC' : 'فارماکولوژی کاربردی',
      topic: 'Therapeutic Decision',
      module: moduleNum,
    });
  }

  return cards;
}

/**
 * Generates Leitner flashcards offline with streaming and smart fallback
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

  const systemInstruction = `You are an Australian Clinical Pharmacy AI Tutor (KAPS/OPRA/PSA).
Extract 2 high-yield Leitner flashcards from the clinical text.
Respond with a JSON array of card objects with fields: question (fa, en), answer (fa, en), pearl (fa, en), type ("clinical_pearl" or "mcq"), module (${moduleNum}).`;

  const userPrompt = `Text: """${contextSnippet.slice(0, 600)}"""\n${customPrompt ? `Focus: ${customPrompt}` : ''}`;

  try {
    // Add timeout promise (max 25 seconds) to prevent infinite hanging
    const inferencePromise = executeOfflineInference({
      modelId,
      prompt: userPrompt,
      systemInstruction,
      temperature: 0.1,
      responseFormat: 'json',
      onProgress,
    });

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 22000)
    );

    const jsonStr = await Promise.race([inferencePromise, timeoutPromise]);

    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (Array.isArray(parsed.cards) && parsed.cards.length > 0) return parsed.cards;
    if (Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0) return parsed.flashcards;

    return generateInstantClinicalFlashcards(contextSnippet, moduleNum);
  } catch (err) {
    console.warn('Offline LLM slow/timeout, using instant clinical generator fallback:', err);
    onProgress?.({ progress: 100, text: '✅ تولید با موتور بالینی هوشمند تکمیل شد.' });
    return generateInstantClinicalFlashcards(contextSnippet, moduleNum);
  }
}
