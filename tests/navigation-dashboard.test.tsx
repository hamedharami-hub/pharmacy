import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomNav } from '@/components/BottomNav';

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));

vi.mock('@/components/study/StudyTrackerContext', () => ({
  useStudyTracker: () => ({
    studyState: { viewedMap: {}, completedMap: {}, flagMap: {} },
  }),
}));

vi.mock('recharts', () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Stub,
    AreaChart: Stub,
    Area: Stub,
    BarChart: Stub,
    Bar: Stub,
    XAxis: Stub,
    YAxis: Stub,
    CartesianGrid: Stub,
    Tooltip: Stub,
    Cell: Stub,
    ReferenceLine: Stub,
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
});

describe('progress dashboard', () => {
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
