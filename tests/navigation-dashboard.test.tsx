import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomNav } from '@/components/BottomNav';
import { StatsBar } from '@/components/StatsBar';
import { SettingsModal } from '@/components/SettingsModal';
import { StudyFlagButton } from '@/components/study/StudyFlagButton';

const setItemFlagMock = vi.hoisted(() => vi.fn());

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/components/study/StudyTrackerContext', () => ({
  useStudyTracker: () => ({
    studyState: { viewedMap: {}, completedMap: {}, flagMap: {} },
  }),
  useStudyTrackerContext: () => ({
    isLoaded: true,
    getOverallStats: () => ({ viewedCount: 4, completedCount: 12, flaggedCount: 3 }),
    getItemFlag: () => null,
    setItemFlag: setItemFlagMock,
  }),
}));

vi.mock('@/lib/firebase', () => ({
  saveFlagDefinitionsToFirestore: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('recharts', () => {
  const SvgStub = ({ children }: { children?: React.ReactNode }) => <svg>{children}</svg>;
  const DivStub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: DivStub,
    AreaChart: SvgStub,
    Area: SvgStub,
    BarChart: SvgStub,
    Bar: SvgStub,
    XAxis: SvgStub,
    YAxis: SvgStub,
    CartesianGrid: SvgStub,
    Tooltip: DivStub,
    Cell: SvgStub,
    ReferenceLine: SvgStub,
  };
});

describe('mobile navigation', () => {
  it('renders the compact navigation without Dashboard or Dispensing tabs', () => {
    render(
      <BottomNav
        language="en"
        activeModule={1}
        onSelectModule={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Triage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Shelf' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knowledge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dashboard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /dispense/i })).not.toBeInTheDocument();
  });

  it('selects a module and marks the active item', () => {
    const onSelectModule = vi.fn();
    render(<BottomNav language="fa" activeModule={1} onSelectModule={onSelectModule} />);

    fireEvent.click(screen.getByRole('button', { name: 'دانش' }));
    expect(onSelectModule).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: 'تریاژ' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps an app-like fixed bottom bar at narrow and wide viewport widths', () => {
    const { container } = render(<BottomNav language="en" activeModule={2} onSelectModule={vi.fn()} />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'bottom-0', 'md:hidden');
    expect(nav?.querySelectorAll('button')).toHaveLength(4);
    expect(Array.from(nav?.querySelectorAll('button') || []).every((button) => button.className.includes('h-11'))).toBe(true);

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360, writable: true });
    window.dispatchEvent(new Event('resize'));
    expect(nav).toHaveClass('inset-x-0');

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 768, writable: true });
    window.dispatchEvent(new Event('resize'));
    expect(nav).toHaveClass('md:hidden');
  });
});

describe('progress dashboard', () => {
  it('renders the modern stats cards with values and analytics affordances', () => {
    render(<StatsBar language="en" totalCards={189} reviewedCount={0} flaggedCount={0} quizScorePct={86} onOpenAnalytics={vi.fn()} />);

    expect(screen.getByText('Study Progress')).toBeInTheDocument();
    expect(screen.getByText('189')).toBeInTheDocument();
    expect(screen.getByText('Flagged Notes')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('renders editable flag settings fields in Settings', () => {
    render(
      <SettingsModal
        language="en"
        theme="day"
        onSetTheme={vi.fn()}
        fontSize="md"
        onSetFontSize={vi.fn()}
        layoutMode="window-grid"
        onChangeLayoutMode={vi.fn()}
        onReset={vi.fn()}
        userProgress={{ flags: {}, deleted: [], customEdits: {}, reviewedCards: {}, quizScores: {}, savedNotes: {} }}
        onImportProgress={vi.fn()}
        onClose={vi.fn()}
        aiConfig={{ preferredProvider: 'gemini', geminiApiKey: '', groqApiKey: '', flashcardModel: '', tutorModel: '', temperature: 0.7, customModels: [] }}
        onSaveAiConfig={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Study flag definitions' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'red flag label' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'blue flag description' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save & sync flags' })).toBeInTheDocument();
  });

  it('exposes one shared flag control that can be used by any module item', () => {
    setItemFlagMock.mockClear();
    render(<StudyFlagButton itemId="knowledge:cyp:CYP3A4:inhibitor:warfarin" language="en" />);
    fireEvent.click(screen.getByRole('button', { name: /Flag knowledge:cyp/i }));
    expect(setItemFlagMock).toHaveBeenCalledWith('knowledge:cyp:CYP3A4:inhibitor:warfarin', 'red');
  });

  it('renders KPI summary and responsive chart tabs', async () => {
    const { StudyMasteryDashboard } = await import('@/components/analytics/StudyMasteryDashboard');
    render(
      <StudyMasteryDashboard
        language="en"
        userProgress={{ flags: {}, deleted: [], customEdits: {}, reviewedCards: {}, quizScores: {}, savedNotes: {} }}
        leitnerCards={[]}
      />
    );

    expect(screen.getByText('Overall Mastery')).toBeInTheDocument();
    expect(screen.getByText('Avg Quiz Score')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Module Mastery/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Leitner Retention/i })).toBeInTheDocument();
  });
});
