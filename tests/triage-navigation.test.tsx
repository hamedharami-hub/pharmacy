import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DiseaseTriagePanel } from '@/components/DiseaseTriagePanel';
import { DISEASES_REGISTRY } from '@/data/diseasesRegistry';
import { getScenariosForDisease } from '@/lib/diseaseTriageBridge';
import { getTriageScenarioId } from '@/lib/triageNavigation';

describe('triage navigation', () => {
  it('preserves an explicit triage target and accepts legacy raw scenario ids', () => {
    expect(getTriageScenarioId('triage:otc-cough')).toBe('otc-cough');
    expect(getTriageScenarioId('otc-cough')).toBe('otc-cough');
    expect(getTriageScenarioId('disease:otc-cough')).toBeNull();
  });

  it('starts a disease-linked scenario with a direct triage context', () => {
    const disease = DISEASES_REGISTRY.find((entry) => getScenariosForDisease(entry.id).length > 0);
    expect(disease).toBeTruthy();
    const scenario = getScenariosForDisease(disease!.id)[0];
    const onStartTriage = vi.fn();

    render(<DiseaseTriagePanel diseaseId={disease!.id} language="en" onStartTriage={onStartTriage} />);
    fireEvent.click(screen.getByRole('button', { name: `Start triage: ${scenario.title.en}` }));

    expect(onStartTriage).toHaveBeenCalledWith(`triage:${scenario.id}`);
  });
});
