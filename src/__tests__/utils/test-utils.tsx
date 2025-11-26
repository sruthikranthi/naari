/**
 * Test utilities for React Testing Library
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase';

// Mock Firebase provider for tests
const MockFirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

/**
 * Custom render function that includes providers
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MockFirebaseProvider>{children}</MockFirebaseProvider>
    </ThemeProvider>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Mock user object for tests
 */
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
};

/**
 * Mock Firestore document data
 */
export const mockPost = {
  id: 'test-post-id',
  content: 'Test post content',
  author: {
    id: 'test-user-id',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
  },
  likes: 10,
  comments: 5,
  timestamp: {
    toDate: () => new Date(),
  },
  isAnonymous: false,
};

