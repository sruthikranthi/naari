/**
 * Firebase mocks for testing
 */

export const mockFirestore = {
  collection: jest.fn((path: string) => ({
    addDoc: jest.fn(),
    doc: jest.fn((id: string) => ({
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    })),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(),
    onSnapshot: jest.fn(),
  })),
  doc: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
};

export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((callback) => {
    callback(null);
    return jest.fn(); // unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendEmailVerification: jest.fn(),
};

export const mockFirebaseApp = {
  name: '[DEFAULT]',
  options: {},
};

export const mockInitializeFirebase = () => ({
  firebaseApp: mockFirebaseApp,
  firestore: mockFirestore,
  auth: mockAuth,
});

