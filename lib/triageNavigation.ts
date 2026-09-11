export function getTriageScenarioId(targetContext: string | null | undefined) {
  if (!targetContext || targetContext.startsWith('disease:')) return null;

  const scenarioId = targetContext.replace(/^(triage|otc):/, '').trim();
  return scenarioId || null;
}
