import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// A mock crashing component
const ProblemChild: React.FC<{ shouldCrash?: boolean }> = ({ shouldCrash }) => {
  if (shouldCrash) {
    throw new Error('Simulated module crash during render');
  }
  return <div>Safe child content</div>;
};

describe('ErrorBoundary component', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary isFa={true}>
        <ProblemChild shouldCrash={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe child content')).toBeDefined();
  });

  it('catches runtime errors and renders bilingual fallback UI with retry button', () => {
    // Suppress console.error during expected throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary isFa={true} moduleName="ماژول تست">
        <ProblemChild shouldCrash={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/خطای غیرمنتظره در بارگذاری ماژول تست/)).toBeDefined();
    expect(screen.getByText(/Simulated module crash/)).toBeDefined();
    expect(screen.getByText('تلاش مجدد و بارگذاری')).toBeDefined();

    consoleSpy.mockRestore();
  });
});
