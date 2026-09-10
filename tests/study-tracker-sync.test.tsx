import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const saveUserDataToFirestoreMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/firebase', () => ({
  saveUserDataToFirestore: saveUserDataToFirestoreMock,
}));

describe('study tracker Firebase sync optimization', () => {
  beforeEach(() => {
    localStorage.clear();
    saveUserDataToFirestoreMock.mockClear();
    vi.useFakeTimers();
  });

  it('debounces rapid viewed changes into one cloud write', async () => {
    const { useStudyTracker } = await import('@/hooks/useStudyTracker');
    const { result } = renderHook(() => useStudyTracker({ user: { uid: 'user-1' } as any }));

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => { result.current.setItemViewed(1, 'topic-1', true); await Promise.resolve(); });
    await act(async () => { result.current.setItemViewed(1, 'topic-2', true); await Promise.resolve(); });
    await act(async () => { result.current.setItemViewed(1, 'topic-3', true); await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(1199); });
    expect(saveUserDataToFirestoreMock).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(1); await Promise.resolve(); });
    expect(saveUserDataToFirestoreMock).toHaveBeenCalledTimes(1);
    expect(saveUserDataToFirestoreMock).toHaveBeenCalledWith('user-1', expect.objectContaining({ studyTracker: expect.anything() }));
  });

  it('does not schedule a second write for an unchanged viewed or flag value', async () => {
    const { useStudyTracker } = await import('@/hooks/useStudyTracker');
    const { result } = renderHook(() => useStudyTracker({ user: { uid: 'user-1' } as any }));
    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => { result.current.setItemViewed(1, 'topic-1', true); await Promise.resolve(); });
    await act(async () => { result.current.setItemViewed(1, 'topic-1', true); await Promise.resolve(); });
    await act(async () => { result.current.setItemFlag('topic-1', 'red'); await Promise.resolve(); });
    await act(async () => { result.current.setItemFlag('topic-1', 'red'); await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(1200); });
    await act(async () => {
      await Promise.resolve();
    });
    expect(saveUserDataToFirestoreMock).toHaveBeenCalledTimes(1);
  });
});
