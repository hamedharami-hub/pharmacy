import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ClinicalRelationsPanel } from '@/components/ClinicalRelationsPanel';
import { ClinicalRelationsReviewPanel } from '@/components/ClinicalRelationsReviewPanel';
import { CLINICAL_RELATIONS } from '@/data/clinicalRegistry';
import {
  getClinicalRelationReviews,
  saveClinicalRelationReview,
} from '@/lib/clinicalRelationReview';

const suggested = CLINICAL_RELATIONS.find((relation) => relation.confidence === 'suggested');

beforeEach(() => {
  window.localStorage.clear();
});

describe('clinical relation review UI', () => {
  it('persists accepted and rejected review decisions locally', () => {
    expect(suggested).toBeTruthy();
    saveClinicalRelationReview(suggested!.id, 'accepted');
    expect(getClinicalRelationReviews()[suggested!.id]).toBe('accepted');
    saveClinicalRelationReview(suggested!.id, 'rejected');
    expect(getClinicalRelationReviews()[suggested!.id]).toBe('rejected');
  });

  it('shows review actions and updates the pending list after acceptance', () => {
    render(<ClinicalRelationsReviewPanel language="en" />);
    expect(screen.getByRole('heading', { name: 'Review suggested clinical relations' })).toBeInTheDocument();
    const acceptButtons = screen.getAllByRole('button', { name: 'Accept' });
    expect(acceptButtons.length).toBeGreaterThan(0);
    fireEvent.click(acceptButtons[0]);
    expect(getClinicalRelationReviews()).toEqual(expect.objectContaining({
      [suggested!.id]: 'accepted',
    }));
  });

  it('keeps the clinical connections panel safe for narrow mobile widths', () => {
    expect(suggested).toBeTruthy();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360, writable: true });
    const { container } = render(<ClinicalRelationsPanel entityId={suggested!.fromId} language="en" />);
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain('overflow-hidden');
    expect(container.querySelector('.min-w-0')).toBeInTheDocument();
    expect(container.querySelector('.shrink-0')).toBeInTheDocument();
  });
});
