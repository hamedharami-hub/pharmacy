import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FLAG_DEFINITIONS,
  getFlagDefinitions,
  saveFlagDefinitions,
} from '@/lib/flagDefinitions';
import {
  DEFAULT_USER_STUDY_STATE,
  getLocalStudyState,
  saveLocalStudyState,
} from '@/lib/studyTracker';

describe('flag definitions persistence', () => {
  beforeEach(() => localStorage.clear());

  it('loads defaults, saves custom labels, and merges them safely', () => {
    expect(getFlagDefinitions()).toEqual(DEFAULT_FLAG_DEFINITIONS);
    saveFlagDefinitions({
      ...DEFAULT_FLAG_DEFINITIONS,
      red: { label: 'فوری‌تر', description: 'مرور امروز' },
    });

    expect(getFlagDefinitions().red).toEqual({ label: 'فوری‌تر', description: 'مرور امروز' });
    expect(getFlagDefinitions().blue).toEqual(DEFAULT_FLAG_DEFINITIONS.blue);
  });

  it('falls back to defaults when local storage contains invalid JSON', () => {
    localStorage.setItem('AU_PHARMACY_FLAG_DEFINITIONS_V1', '{bad-json');
    expect(getFlagDefinitions()).toEqual(DEFAULT_FLAG_DEFINITIONS);
  });
});

describe('study tracker local persistence', () => {
  beforeEach(() => localStorage.clear());

  it('persists viewed and flag maps independently from completed state', () => {
    const state = {
      ...DEFAULT_USER_STUDY_STATE,
      viewedMap: { 'otc:one': true },
      flagMap: { 'otc:one': 'red' as const },
      completedMap: {},
    };
    saveLocalStudyState(state);
    const loaded = getLocalStudyState();

    expect(loaded.viewedMap['otc:one']).toBe(true);
    expect(loaded.flagMap['otc:one']).toBe('red');
    expect(loaded.completedMap['otc:one']).toBeUndefined();
  });

  it('recovers from malformed tracker storage', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('AU_PHARMACY_STUDY_TRACKER_V1', 'not-json');
    expect(getLocalStudyState()).toEqual(DEFAULT_USER_STUDY_STATE);
    errorSpy.mockRestore();
  });
});
