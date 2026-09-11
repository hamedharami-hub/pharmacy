import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ClinicalRelationsPanel } from '@/components/ClinicalRelationsPanel';
import { ClinicalRelationsReviewPanel } from '@/components/ClinicalRelationsReviewPanel';
import { CLINICAL_RELATIONS, getClinicalEntity } from '@/data/clinicalRegistry';
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

  it('shows approved links in the open compact layout without per-row relation labels', async () => {
    expect(suggested).toBeTruthy();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360, writable: true });
    const { container } = render(<ClinicalRelationsPanel entityId={suggested!.fromId} language="en" />);
    expect(container.querySelector('section')).toBeInTheDocument();
    expect(screen.queryByText('Suggested relation')).not.toBeInTheDocument();

    act(() => saveClinicalRelationReview(suggested!.id, 'accepted'));
    await waitFor(() => expect(screen.getByText('Only source-backed or review-approved links')).toBeInTheDocument());
    const section = container.querySelector('section');
    expect(section?.className).not.toContain('overflow-hidden');
    expect(container.querySelector('[aria-expanded]')).not.toBeInTheDocument();
    expect(container.querySelector('.min-w-0')).toBeInTheDocument();
  });

  it('keeps the generic medicine and its brand in one row', () => {
    const medicineRelation = CLINICAL_RELATIONS.find((relation) => relation.type === 'has-product');
    expect(medicineRelation).toBeTruthy();
    const product = getClinicalEntity(medicineRelation!.toId);
    expect(product?.type).toBe('product');

    render(<ClinicalRelationsPanel entityId={medicineRelation!.fromId} language="en" />);
    const generic = screen.getByText(String(product!.metadata?.genericName));
    const brand = screen.getByText(product!.title.en);
    expect(generic.closest('.grid')).toContainElement(brand);
  });
});
