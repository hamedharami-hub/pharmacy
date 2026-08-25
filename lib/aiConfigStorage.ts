'use client';

import { UserAiConfig, AiModelOption } from '@/types/pharmacy';
import { DEFAULT_AI_CONFIG, sanitizeModelId } from '@/lib/aiService';

export const AI_CONFIG_STORAGE_KEY = 'pharmacy_ai_config_v4';

export function getClientAiConfig(): UserAiConfig {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  try {
    const raw =
      localStorage.getItem(AI_CONFIG_STORAGE_KEY) ||
      localStorage.getItem('pharmacy_ai_config_v3') ||
      localStorage.getItem('pharmacy_ai_config_v2');
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);

    const modelList: AiModelOption[] = Array.isArray(parsed.customModels)
      ? parsed.customModels.filter((m: any) => m && m.id)
      : [];

    const validatedConfig: UserAiConfig = {
      preferredProvider:
        parsed.preferredProvider === 'groq' || parsed.preferredProvider === 'xai'
          ? parsed.preferredProvider
          : 'gemini',
      geminiApiKey: parsed.geminiApiKey || '',
      groqApiKey: parsed.groqApiKey || '',
      xaiApiKey: parsed.xaiApiKey || '',
      flashcardModel: parsed.flashcardModel || (modelList[0]?.id || ''),
      tutorModel: parsed.tutorModel || (modelList[0]?.id || ''),
      temperature: typeof parsed.temperature === 'number' ? parsed.temperature : 0.2,
      customModels: modelList,
    };

    return validatedConfig;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveClientAiConfig(config: UserAiConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save AI config to localStorage', err);
  }
}
