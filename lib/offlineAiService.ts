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
      fa: 'بسیار کم‌حجم و پرسرعت؛ مصرف بسیار کم رم، مناسب برای تولید سریع فلش‌کارت در انواع سیستم‌ها.',
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
      error: 'مرورگر شما از WebGPU پشتیبانی نمی‌کند. لطفاً از آخرین نسخه Chrome، Edge یا Brave استفاده فرمایید.',
    };
  }

  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        error: 'کارت گرافیک یا شتاب‌دهنده سخت‌افزاری WebGPU در دسترس نیست.',
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
}

/**
 * Generates text response completely offline
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
  onProgress?: (progress: { progress: number; text: string }) => void;
}): Promise<string> {
  const engine = await getOrLoadOfflineEngine(modelId, onProgress);

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  let activeSys = systemInstruction || '';
  if (responseFormat === 'json') {
    activeSys = `${activeSys}\n\nIMPORTANT: Return ONLY valid, raw JSON array of objects without any markdown wrappers or conversational intro.`.trim();
  }

  if (activeSys) {
    messages.push({ role: 'system', content: activeSys });
  }
  messages.push({ role: 'user', content: prompt });

  const reply = await engine.chat.completions.create({
    messages,
    temperature,
    max_tokens: 1800,
  });

  let rawOutput = reply.choices?.[0]?.message?.content || '';
  if (responseFormat === 'json') {
    rawOutput = sanitizeAndRepairJson(rawOutput);
  }

  return rawOutput;
}

/**
 * Generates Leitner flashcards completely offline using the local engine
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
  const systemInstruction = `You are an expert Australian Clinical Pharmacy AI Tutor preparing Australian pharmacy intern candidates (KAPS/OPRA/PSA).
Generate high-yield Leitner spaced repetition flashcards from the provided study text snippet.

You MUST respond strictly with a valid JSON object containing a "cards" array.
Format:
{
  "cards": [
    {
      "question": { "fa": "سوال به فارسی", "en": "Question in English" },
      "answer": { "fa": "پاسخ کامل و بالینی به فارسی", "en": "Full clinical answer in English" },
      "pearl": { "fa": "نکته طلایی داروسازی به فارسی", "en": "High yield clinical pearl in English" },
      "type": "clinical_pearl",
      "category": "داروشناسی بالینی",
      "topic": "Clinical Practice",
      "module": ${moduleNum}
    }
  ]
}
Supported types: "clinical_pearl", "mcq", "cal_warning", "triage_redflag", "calculation".
Return ONLY the JSON object.`;

  const userPrompt = `Generate 2 to 4 high-yield Australian pharmacy Leitner flashcards based on this clinical text:
"""
${contextSnippet}
"""
${customPrompt ? `\nAdditional user focus: ${customPrompt}` : ''}`;

  const jsonStr = await executeOfflineInference({
    modelId,
    prompt: userPrompt,
    systemInstruction,
    temperature: 0.2,
    responseFormat: 'json',
    onProgress,
  });

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.cards)) return parsed.cards;
    if (Array.isArray(parsed.flashcards)) return parsed.flashcards;
    return [];
  } catch (e) {
    const repaired = sanitizeAndRepairJson(jsonStr);
    const parsedRepaired = JSON.parse(repaired);
    if (Array.isArray(parsedRepaired)) return parsedRepaired;
    if (Array.isArray(parsedRepaired?.cards)) return parsedRepaired.cards;
    return [];
  }
}
