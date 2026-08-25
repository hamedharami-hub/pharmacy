'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/types/pharmacy';
import { LeitnerCard } from '@/types/leitner';
import {
  Settings,
  X,
  Zap,
  Clock,
  Shuffle,
  Calendar,
  Layers,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Check,
  Globe,
  Sliders,
  ShieldAlert,
  Flame,
  HelpCircle,
} from 'lucide-react';

export interface LeitnerStudySettings {
  algorithm: 'fsrs' | 'classic_leitner' | 'cram';
  cardOrder: 'due_first' | 'random' | 'hardest_first' | 'by_module';
  dailyLimit: number | 'unlimited';
  languageMode: 'bilingual' | 'en_only' | 'fa_only';
  hidePearlsUntilFlip: boolean;
  showCalLabels: boolean;
  countdownTimer: number; // 0 = off, 30, 60, 90 seconds
  enableHaptics: boolean;
  autoPlayAudio: boolean;
}

export const DEFAULT_LEITNER_SETTINGS: LeitnerStudySettings = {
  algorithm: 'fsrs',
  cardOrder: 'due_first',
  dailyLimit: 'unlimited',
  languageMode: 'bilingual',
  hidePearlsUntilFlip: true,
  showCalLabels: true,
  countdownTimer: 0,
  enableHaptics: true,
  autoPlayAudio: false,
};

export const LEITNER_SETTINGS_STORAGE_KEY = 'pharmacy_leitner_study_settings_v2';

export function getStoredLeitnerSettings(): LeitnerStudySettings {
  if (typeof window === 'undefined') return DEFAULT_LEITNER_SETTINGS;
  try {
    const raw = localStorage.getItem(LEITNER_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_LEITNER_SETTINGS;
    return { ...DEFAULT_LEITNER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LEITNER_SETTINGS;
  }
}

export function saveStoredLeitnerSettings(settings: LeitnerStudySettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LEITNER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save Leitner settings:', err);
  }
}

interface LeitnerStudySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  settings: LeitnerStudySettings;
  onUpdateSettings: (newSettings: LeitnerStudySettings) => void;
  onExportJson?: () => void;
  onImportJson?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCards?: () => void;
  onLoadSamples?: () => void;
  totalCardsCount: number;
}

export const LeitnerStudySettingsModal: React.FC<LeitnerStudySettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  settings,
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onClearCards,
  onLoadSamples,
  totalCardsCount,
}) => {
  const isFa = language === 'fa';
  const [activeTab, setActiveTab] = useState<'study' | 'display' | 'advanced' | 'backup'>('study');
  const [localSettings, setLocalSettings] = useState<LeitnerStudySettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof LeitnerStudySettings>(key: K, value: LeitnerStudySettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveStoredLeitnerSettings(updated);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="app-card border app-border rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        dir={isFa ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b app-border flex items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black app-text">
                {isFa ? 'تنظیمات پیشرفته مطالعه لایتنر' : 'Leitner Study & Review Settings'}
              </h3>
              <p className="text-xs app-muted">
                {isFa
                  ? 'سفارشی‌سازی الگوریتم مرور، فواصل، زبان و حالت تمرکز'
                  : 'Customize spaced repetition, queue ordering & presentation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl app-bg hover:bg-black/10 dark:hover:bg-slate-800 app-text border app-border transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b app-border app-bg p-1.5 gap-1 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'study'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isFa ? 'الگوریتم و صف' : 'Algorithm & Queue'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'display'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isFa ? 'زبان و نمایش' : 'Display & Lang'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isFa ? 'تایمر و بازخورد' : 'Timer & Audio'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'app-muted hover:app-text hover:bg-black/5 dark:hover:bg-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isFa ? 'مدیریت و داده‌ها' : 'Backup & Data'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: ALGORITHM & QUEUE */}
          {activeTab === 'study' && (
            <div className="space-y-4">
              {/* Algorithm Choice */}
              <div className="space-y-2">
                <label className="font-bold app-text flex items-center gap-1.5 text-sm">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>{isFa ? 'موتور محاسباتی و زمان‌بندی مرور:' : 'Spaced Repetition Algorithm:'}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'fsrs',
                      title: isFa ? 'هوشمند FSRS v5' : 'FSRS v5 Smart',
                      desc: isFa ? 'محاسبه پایداری حافظه (پیش‌فرض Anki)' : 'Memory Stability & Difficulty',
                    },
                    {
                      id: 'classic_leitner',
                      title: isFa ? 'جعبه لایتنر سنتی' : 'Classic Leitner',
                      desc: isFa ? '۵ جعبه استاندارد (۱، ۳، ۷، ۱۴، ۳۰ روز)' : '5 Fixed Interval Boxes',
                    },
                    {
                      id: 'cram',
                      title: isFa ? 'آزمون فشرده (Cram)' : 'Cramming Mode',
                      desc: isFa ? 'مرور سریع همه کارت‌ها بدون تغییر موعد' : 'Review all cards freely',
                    },
                  ].map((algo) => (
                    <button
                      key={algo.id}
                      type="button"
                      onClick={() => handleChange('algorithm', algo.id as any)}
                      className={`p-3 rounded-2xl border text-start transition cursor-pointer flex flex-col justify-between gap-1 ${
                        localSettings.algorithm === algo.id
                          ? 'border-purple-500 bg-purple-600/15 ring-1 ring-purple-500/30'
                          : 'app-bg app-border hover:border-slate-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold app-text">{algo.title}</span>
                        {localSettings.algorithm === algo.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <span className="text-[10.5px] app-muted">{algo.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Ordering */}
              <div className="space-y-2 pt-2 border-t app-border">
                <label className="font-bold app-text flex items-center gap-1.5 text-sm">
                  <Shuffle className="w-4 h-4 text-cyan-400" />
                  <span>{isFa ? 'ترتیب نمایش کارت‌ها در صف مطالعه:' : 'Card Queue Ordering:'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'due_first', label: isFa ? 'کارت‌های موعددار اول' : 'Due Date First' },
                    { id: 'random', label: isFa ? 'تصادفی و شافل (Shuffle)' : 'Random Shuffle' },
                    { id: 'hardest_first', label: isFa ? 'سخت‌ترین مفاهیم اول' : 'Hardest / Lowest Box First' },
                    { id: 'by_module', label: isFa ? 'بر اساس دسته‌بندی و درخت دانش' : 'Grouped by Knowledge Tree' },
                  ].map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => handleChange('cardOrder', ord.id as any)}
                      className={`p-2.5 rounded-xl border text-start transition cursor-pointer flex items-center justify-between ${
                        localSettings.cardOrder === ord.id
                          ? 'border-cyan-500 bg-cyan-600/15 text-cyan-200'
                          : 'app-bg app-border app-muted hover:app-text'
                      }`}
                    >
                      <span className="font-bold">{ord.label}</span>
                      {localSettings.cardOrder === ord.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily Limit */}
              <div className="space-y-2 pt-2 border-t app-border">
                <label className="font-bold app-text flex items-center gap-1.5 text-sm">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'محدودیت تعداد کارت در هر جلسه مرور:' : 'Daily / Session Review Limit:'}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 10, label: '۱۰ کارت' },
                    { id: 20, label: '۲۰ کارت' },
                    { id: 30, label: '۳۰ کارت' },
                    { id: 50, label: '۵۰ کارت' },
                    { id: 'unlimited', label: isFa ? 'همه کارت‌های موعددار (نامحدود)' : 'All Due (Unlimited)' },
                  ].map((lim) => (
                    <button
                      key={String(lim.id)}
                      type="button"
                      onClick={() => handleChange('dailyLimit', lim.id as any)}
                      className={`px-3 py-1.5 rounded-xl border font-bold transition cursor-pointer ${
                        localSettings.dailyLimit === lim.id
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'app-bg app-border app-muted hover:app-text'
                      }`}
                    >
                      {lim.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISPLAY & LANGUAGE */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              {/* Language Mode */}
              <div className="space-y-2">
                <label className="font-bold app-text flex items-center gap-1.5 text-sm">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>{isFa ? 'زبان نمایش سوال و پاسخ کارت‌ها:' : 'Card Language Mode:'}</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'bilingual', label: isFa ? 'دوزبانه کامل (Fa + En)' : 'Bilingual (Both)', desc: isFa ? 'فارسی و انگلیسی با هم' : 'Both languages shown' },
                    { id: 'en_only', label: isFa ? 'فقط انگلیسی تخصصی' : 'English Only', desc: isFa ? 'مناسب آزمون KAPS و استرالیا' : 'Medical English focus' },
                    { id: 'fa_only', label: isFa ? 'فقط فارسی' : 'Farsi Only', desc: isFa ? 'تمرکز کامل روی متن فارسی' : 'Farsi translation focus' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleChange('languageMode', lang.id as any)}
                      className={`p-3 rounded-2xl border text-start transition cursor-pointer flex flex-col justify-between gap-1 ${
                        localSettings.languageMode === lang.id
                          ? 'border-indigo-500 bg-indigo-600/15 text-indigo-200 ring-1 ring-indigo-500/30'
                          : 'app-bg app-border app-muted hover:app-text'
                      }`}
                    >
                      <span className="font-bold">{lang.label}</span>
                      <span className="text-[10px] app-muted">{lang.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t app-border">
                <label
                  className="flex items-center justify-between p-3 rounded-2xl app-bg border app-border cursor-pointer hover:border-slate-400/50 transition"
                  onClick={() => handleChange('hidePearlsUntilFlip', !localSettings.hidePearlsUntilFlip)}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold app-text flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isFa ? 'پنهان‌سازی نکته طلایی تا زمان مشاهده پاسخ' : 'Hide Pearls Until Card Flipped'}</span>
                    </span>
                    <p className="text-[11px] app-muted">
                      {isFa ? 'جلوگیری از لو رفتن پاسخ پیش از حدس زدن' : 'Prevent spoiling the answer before guessing'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.hidePearlsUntilFlip}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                  />
                </label>

                <label
                  className="flex items-center justify-between p-3 rounded-2xl app-bg border app-border cursor-pointer hover:border-slate-400/50 transition"
                  onClick={() => handleChange('showCalLabels', !localSettings.showCalLabels)}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold app-text flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isFa ? 'نمایش برچسب‌های احتیاطی استرالیا (CAL Labels)' : 'Show Australian CAL Labels'}</span>
                    </span>
                    <p className="text-[11px] app-muted">
                      {isFa ? 'نمایش برچسب‌های رسمی تحویل دارو (Label 1, 2, 12...)' : 'Show official pharmacy auxiliary labels'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.showCalLabels}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: TIMER & AUDIO */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              {/* Countdown Timer */}
              <div className="space-y-2">
                <label className="font-bold app-text flex items-center gap-1.5 text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{isFa ? 'تایمر معکوس تفکر و پاسخ (شبیه‌ساز آزمون):' : 'Thinking Countdown Timer:'}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 0, label: isFa ? 'بدون تایمر (آزاد)' : 'Off (Unlimited)' },
                    { id: 30, label: isFa ? '۳۰ ثانیه' : '30 Seconds' },
                    { id: 60, label: isFa ? '۶۰ ثانیه' : '60 Seconds' },
                    { id: 90, label: isFa ? '۹۰ ثانیه' : '90 Seconds' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleChange('countdownTimer', t.id)}
                      className={`p-2.5 rounded-xl border font-bold transition cursor-pointer text-center ${
                        localSettings.countdownTimer === t.id
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'app-bg app-border app-muted hover:app-text'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Haptics */}
              <div className="space-y-3 pt-2 border-t app-border">
                <label
                  className="flex items-center justify-between p-3 rounded-2xl app-bg border app-border cursor-pointer hover:border-slate-400/50 transition"
                  onClick={() => handleChange('enableHaptics', !localSettings.enableHaptics)}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold app-text flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isFa ? 'لرزش و بازخورد حسی هنگام رتبه‌بندی کارت (Haptic)' : 'Haptic Feedback on Rating'}</span>
                    </span>
                    <p className="text-[11px] app-muted">
                      {isFa ? 'لرزش ملایم در دستگاه‌های لمسی و موبایل' : 'Gentle vibration on rating cards'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.enableHaptics}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-purple-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & DATA MANAGEMENT */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl app-bg border app-border flex items-center justify-between">
                <div>
                  <span className="font-bold app-text text-sm">
                    {isFa ? 'تعداد کل کارت‌های موجود در حافظه:' : 'Total Cards in Library:'}
                  </span>
                  <p className="text-xs app-muted">
                    {isFa ? `${totalCardsCount} فلش‌کارت ثبت شده` : `${totalCardsCount} cards stored`}
                  </p>
                </div>
                {onLoadSamples && (
                  <button
                    type="button"
                    onClick={onLoadSamples}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isFa ? 'بارگذاری نمونه‌های جامع' : 'Load Sample Cards'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onExportJson && (
                  <button
                    type="button"
                    onClick={onExportJson}
                    className="p-3 rounded-2xl app-bg hover:bg-black/5 dark:hover:bg-slate-800 border app-border app-text font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>{isFa ? 'دانلود فایل پشتیبان (JSON)' : 'Export Backup JSON'}</span>
                  </button>
                )}

                {onImportJson && (
                  <label className="p-3 rounded-2xl app-bg hover:bg-black/5 dark:hover:bg-slate-800 border app-border app-text font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>{isFa ? 'بارگذاری فایل کارت‌ها (JSON)' : 'Import Backup JSON'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={onImportJson}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {onClearCards && (
                <div className="pt-2 border-t app-border">
                  <button
                    type="button"
                    onClick={onClearCards}
                    className="w-full p-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isFa ? 'پاکسازی کامل همه کارت‌های لایتنر' : 'Clear All Leitner Cards'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t app-border flex items-center justify-between bg-slate-900/40">
          <button
            type="button"
            onClick={() => {
              setLocalSettings(DEFAULT_LEITNER_SETTINGS);
              onUpdateSettings(DEFAULT_LEITNER_SETTINGS);
              saveStoredLeitnerSettings(DEFAULT_LEITNER_SETTINGS);
            }}
            className="px-3 py-1.5 rounded-xl app-bg border app-border text-xs app-muted hover:app-text transition cursor-pointer"
          >
            {isFa ? 'بازنشانی پیش‌فرض' : 'Reset Defaults'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            {isFa ? 'تأیید و ذخیره' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
