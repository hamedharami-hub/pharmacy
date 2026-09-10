import { FlagColor } from '@/types/pharmacy';

export type FlagDefinition = { label: string; description: string };
export type FlagDefinitions = Record<Exclude<FlagColor, null>, FlagDefinition>;

export const DEFAULT_FLAG_DEFINITIONS: FlagDefinitions = {
  red: { label: 'فوری', description: 'نیازمند مرور سریع یا توجه ویژه' },
  yellow: { label: 'مرور', description: 'برای مرور دوباره در فرصت بعدی' },
  green: { label: 'مسلط', description: 'موضوع مهمی که به‌خوبی یاد گرفته شده' },
  blue: { label: 'مرجع', description: 'نکته مرجع یا مورد علاقه' },
};

const STORAGE_KEY = 'AU_PHARMACY_FLAG_DEFINITIONS_V1';

export function getFlagDefinitions(): FlagDefinitions {
  if (typeof window === 'undefined') return DEFAULT_FLAG_DEFINITIONS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...DEFAULT_FLAG_DEFINITIONS, ...saved } : DEFAULT_FLAG_DEFINITIONS;
  } catch {
    return DEFAULT_FLAG_DEFINITIONS;
  }
}

export function saveFlagDefinitions(definitions: FlagDefinitions) {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(definitions));
}
