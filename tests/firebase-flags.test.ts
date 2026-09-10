import { beforeEach, describe, expect, it, vi } from 'vitest';

const setDocMock = vi.fn().mockResolvedValue(undefined);
const docMock = vi.fn(() => ({ path: 'users/test-user/data/studyState' }));

vi.mock('firebase/app', () => ({
  getApps: () => [],
  getApp: () => ({}),
  initializeApp: () => ({}),
}));
vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: docMock,
  setDoc: setDocMock,
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  deleteField: vi.fn(),
}));

describe('Firebase flag-definition sync', () => {
  beforeEach(() => {
    setDocMock.mockClear();
    docMock.mockClear();
  });

  it('writes flag definitions through the shared study-state document', async () => {
    const { saveFlagDefinitionsToFirestore } = await import('@/lib/firebase');
    await saveFlagDefinitionsToFirestore('test-user', {
      red: { label: 'Urgent', description: 'Review today' },
      yellow: { label: 'Review', description: 'Review later' },
      green: { label: 'Mastered', description: 'Known well' },
      blue: { label: 'Reference', description: 'Keep as reference' },
    });

    expect(docMock).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user', 'data', 'studyState');
    expect(setDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ flagDefinitions: expect.objectContaining({ red: expect.objectContaining({ label: 'Urgent' }) }) }),
      { merge: true }
    );
  });
});
