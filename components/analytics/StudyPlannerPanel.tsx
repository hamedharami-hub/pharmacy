'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlarmClock, CalendarDays, CircleGauge, Play, Timer, TriangleAlert } from 'lucide-react';
import { LeitnerCard } from '@/types/leitner';
import { useStudyTracker } from '@/components/study/StudyTrackerContext';
import type { QuizHistoryRecord } from './StudyMasteryDashboard';

const PLAN_STORAGE_KEY = 'AU_PHARMACY_STUDY_PLAN_V1';
const QUIZ_HISTORY_STORAGE_KEY = 'AU_PHARMACY_QUIZ_HISTORY_V2';
const EXAM_LENGTH_SECONDS = 10 * 60;
const EXAM_QUESTION_COUNT = 5;

interface StudyPlannerPanelProps {
  language: 'fa' | 'en';
  leitnerCards: LeitnerCard[];
  onExamComplete: () => void;
}

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const startOfWeek = (value: Date) => {
  const date = startOfDay(value);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
};

const formatMinutes = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export const StudyPlannerPanel: React.FC<StudyPlannerPanelProps> = ({ language, leitnerCards, onExamComplete }) => {
  const isFa = language === 'fa';
  const tracker = useStudyTracker();
  const [dailyTarget, setDailyTarget] = useState(15);
  const [weeklyTarget, setWeeklyTarget] = useState(75);
  const [isPlanLoaded, setIsPlanLoaded] = useState(false);
  const [examCards, setExamCards] = useState<LeitnerCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_LENGTH_SECONDS);
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [isExamComplete, setIsExamComplete] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [examSaved, setExamSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLAN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { dailyTarget?: number; weeklyTarget?: number };
        if (typeof parsed.dailyTarget === 'number') setDailyTarget(Math.max(1, Math.min(100, parsed.dailyTarget)));
        if (typeof parsed.weeklyTarget === 'number') setWeeklyTarget(Math.max(1, Math.min(500, parsed.weeklyTarget)));
      }
    } catch {
      // Use the defaults if browser storage cannot be read.
    } finally {
      setIsPlanLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isPlanLoaded) return;
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ dailyTarget, weeklyTarget }));
  }, [dailyTarget, weeklyTarget, isPlanLoaded]);

  const progress = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const week = startOfWeek(now);
    const records = Object.values(tracker.studyState.itemRecords || {});
    const completedToday = records.filter((record) => record.completedAt && new Date(record.completedAt) >= today).length;
    const completedWeek = records.filter((record) => record.completedAt && new Date(record.completedAt) >= week).length;
    return { completedToday, completedWeek };
  }, [tracker.studyState.itemRecords]);

  const dueCards = useMemo(() => {
    const now = new Date();
    return leitnerCards.filter((card) => !card.nextReviewDate || new Date(card.nextReviewDate) <= now);
  }, [leitnerCards]);

  const weakTopics = useMemo(() => {
    const topics = new Map<string, { incorrect: number; total: number; lowBox: number }>();
    leitnerCards.forEach((card) => {
      const label = card.knowledgeTree?.system?.[language] || card.topic || card.category || (isFa ? 'بدون موضوع' : 'Uncategorised');
      const value = topics.get(label) || { incorrect: 0, total: 0, lowBox: 0 };
      const history = card.history || [];
      value.total += history.length;
      value.incorrect += history.filter((item) => item.result === 'incorrect').length;
      if (card.box <= 2) value.lowBox += 1;
      topics.set(label, value);
    });
    return [...topics.entries()]
      .map(([label, value]) => ({ label, score: value.incorrect * 3 + value.lowBox * 2 + Math.max(0, 2 - value.total) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [isFa, language, leitnerCards]);

  const currentCard = examCards[currentIndex];

  const persistExam = useCallback((cards: LeitnerCard[], correct: number, secondsLeft: number) => {
    if (cards.length === 0 || examSaved) return;
    const now = new Date();
    const record: QuizHistoryRecord = {
      id: `timed-exam-${now.getTime()}`,
      sessionName: 'Timed Review',
      sessionNameFa: 'آزمون زمان‌دار',
      date: now.toISOString().slice(0, 10),
      displayDate: `${now.getMonth() + 1}/${now.getDate()}`,
      totalQuestions: cards.length,
      correctAnswers: correct,
      scorePct: Math.round((correct / cards.length) * 100),
      timeSpentMinutes: Math.max(1, Math.round((EXAM_LENGTH_SECONDS - secondsLeft) / 60)),
    };
    try {
      const existing = JSON.parse(localStorage.getItem(QUIZ_HISTORY_STORAGE_KEY) || '[]');
      const history = Array.isArray(existing) ? existing : [];
      localStorage.setItem(QUIZ_HISTORY_STORAGE_KEY, JSON.stringify([...history, record].slice(-100)));
    } catch {
      // The result remains visible in this session even if browser storage is unavailable.
    }
    setExamSaved(true);
    onExamComplete();
  }, [examSaved, onExamComplete]);

  const finishExam = useCallback(() => {
    setIsExamRunning(false);
    setIsExamComplete(true);
    persistExam(examCards, correctCount, timeLeft);
  }, [correctCount, examCards, persistExam, timeLeft]);

  useEffect(() => {
    if (!isExamRunning || timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isExamRunning, timeLeft]);

  useEffect(() => {
    if (isExamRunning && timeLeft === 0) finishExam();
  }, [finishExam, isExamRunning, timeLeft]);

  const beginExam = () => {
    const preferredCards = [...dueCards, ...leitnerCards.filter((card) => !dueCards.some((due) => due.id === card.id))]
      .filter((card) => card.question?.[language] && card.answer?.[language])
      .slice(0, EXAM_QUESTION_COUNT);
    setExamCards(preferredCards);
    setCurrentIndex(0);
    setCorrectCount(0);
    setTimeLeft(EXAM_LENGTH_SECONDS);
    setSelectedOptionId(null);
    setExamSaved(false);
    setIsExamComplete(false);
    setIsExamRunning(preferredCards.length > 0);
  };

  const answerCurrentCard = (isCorrect: boolean) => {
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(nextCorrect);
    setSelectedOptionId(null);
    if (currentIndex + 1 >= examCards.length) {
      setIsExamRunning(false);
      setIsExamComplete(true);
      persistExam(examCards, nextCorrect, timeLeft);
      return;
    }
    setCurrentIndex((index) => index + 1);
  };

  return (
    <section className="p-4 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-md space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-400" />{isFa ? 'برنامهٔ مطالعه و تمرین هدفمند' : 'Study plan & focused practice'}</h4>
          <p className="text-[11px] text-slate-400 mt-1">{isFa ? 'هدف‌ها در همین دستگاه ذخیره می‌شوند و با پیشرفت واقعی شما به‌روزرسانی می‌گردند.' : 'Targets are stored on this device and reflect your recorded study activity.'}</p>
        </div>
        <div className="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-950 text-amber-300 border border-amber-500/20 flex items-center gap-1"><Timer className="w-3.5 h-3.5" />{formatMinutes(timeLeft)}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-3 bg-black/35 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-200"><span>{isFa ? 'هدف امروز' : 'Daily target'}</span><span className="text-emerald-400">{progress.completedToday}/{dailyTarget}</span></div>
          <input aria-label={isFa ? 'هدف روزانه' : 'Daily target'} type="range" min="5" max="50" step="5" value={dailyTarget} onChange={(event) => setDailyTarget(Number(event.target.value))} className="w-full accent-emerald-500" />
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, progress.completedToday / dailyTarget * 100)}%` }} /></div>
        </div>
        <div className="rounded-2xl p-3 bg-black/35 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-200"><span>{isFa ? 'هدف هفته' : 'Weekly target'}</span><span className="text-sky-400">{progress.completedWeek}/{weeklyTarget}</span></div>
          <input aria-label={isFa ? 'هدف هفتگی' : 'Weekly target'} type="range" min="25" max="200" step="25" value={weeklyTarget} onChange={(event) => setWeeklyTarget(Number(event.target.value))} className="w-full accent-sky-500" />
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${Math.min(100, progress.completedWeek / weeklyTarget * 100)}%` }} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-2xl p-3 bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200"><AlarmClock className="w-4 h-4" />{isFa ? `${dueCards.length} کارت موعددار` : `${dueCards.length} cards due`}</div>
          <p className="mt-1 text-[11px] text-slate-400">{dueCards.length > 0 ? (isFa ? 'مرور این کارت‌ها بهترین نقطهٔ شروع برای امروز است.' : 'These reviews are the best place to start today.') : (isFa ? 'هیچ مرور عقب‌افتاده‌ای ندارید.' : 'No reviews are overdue.')}</p>
        </div>
        <div className="rounded-2xl p-3 bg-rose-500/5 border border-rose-500/20">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-200"><TriangleAlert className="w-4 h-4" />{isFa ? 'موضوع‌های نیازمند مرور' : 'Topics to revisit'}</div>
          <p className="mt-1 text-[11px] text-slate-400">{weakTopics.length ? weakTopics.map((item) => item.label).join(' • ') : (isFa ? 'پس از ثبت مرور کارت‌ها، تحلیل موضوعی اینجا نمایش داده می‌شود.' : 'Topic analysis appears after card reviews are recorded.')}</p>
        </div>
      </div>

      {isExamRunning && currentCard ? (
        <div className="rounded-2xl p-4 bg-indigo-500/10 border border-indigo-500/30 space-y-3">
          <div className="flex justify-between text-[11px] text-slate-400"><span>{isFa ? `سوال ${currentIndex + 1} از ${examCards.length}` : `Question ${currentIndex + 1} of ${examCards.length}`}</span><span>{currentCard.knowledgeTree?.system?.[language] || currentCard.topic}</span></div>
          <p className="text-sm font-bold text-slate-100 leading-6">{currentCard.question[language]}</p>
          {currentCard.mcqOptions?.length ? <div className="grid gap-2">{currentCard.mcqOptions.map((option) => <button key={option.id} type="button" onClick={() => setSelectedOptionId(option.id)} className={`text-start p-2 rounded-xl border text-xs ${selectedOptionId === option.id ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>{option.text[language]}</button>)}</div> : <p className="text-[11px] text-slate-400">{isFa ? 'پاسخ را در ذهن مرور کنید، سپس ارزیابی خود را ثبت کنید.' : 'Recall the answer, then record your self-assessment.'}</p>}
          <details className="text-xs text-slate-300"><summary className="cursor-pointer text-sky-300">{isFa ? 'نمایش پاسخ' : 'Show answer'}</summary><p className="mt-2 leading-5">{currentCard.answer[language]}</p></details>
          <div className="flex gap-2"><button type="button" onClick={() => answerCurrentCard(Boolean(currentCard.mcqOptions?.find((option) => option.id === selectedOptionId)?.isCorrect))} disabled={Boolean(currentCard.mcqOptions?.length && !selectedOptionId)} className="px-3 py-2 rounded-xl bg-emerald-600 disabled:opacity-40 text-xs font-bold text-white">{isFa ? 'ثبت پاسخ' : 'Record answer'}</button><button type="button" onClick={() => answerCurrentCard(false)} className="px-3 py-2 rounded-xl bg-rose-600/80 text-xs font-bold text-white">{isFa ? 'نمی‌دانستم' : 'I did not know'}</button></div>
        </div>
      ) : isExamComplete ? (
        <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1"><CircleGauge className="w-5 h-5 mx-auto text-emerald-400" /><p className="text-sm font-bold text-slate-100">{isFa ? `نتیجه: ${correctCount} از ${examCards.length}` : `Result: ${correctCount} of ${examCards.length}`}</p><p className="text-[11px] text-slate-400">{isFa ? 'نتیجه به تاریخچهٔ واقعی آزمون‌ها اضافه شد.' : 'The result was added to your real quiz history.'}</p></div>
      ) : (
        <button type="button" onClick={beginExam} disabled={leitnerCards.length === 0} className="w-full rounded-2xl py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-extrabold flex justify-center items-center gap-2"><Play className="w-4 h-4" />{isFa ? 'شروع آزمون زمان‌دار ۱۰ دقیقه‌ای' : 'Start 10-minute timed review'}</button>
      )}
      {leitnerCards.length === 0 && <p className="text-center text-[11px] text-slate-500">{isFa ? 'برای شروع آزمون، ابتدا کارت لایتنر بسازید.' : 'Create Leitner cards to start a timed review.'}</p>}
    </section>
  );
};
