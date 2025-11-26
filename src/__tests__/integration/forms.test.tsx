/**
 * Integration tests for form submissions
 */

import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { CreatePost } from '@/components/create-post';

// Mock Firebase
jest.mock('@/firebase', () => ({
  useUser: jest.fn(() => ({
    user: {
      uid: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg',
      emailVerified: true,
    },
    isUserLoading: false,
  })),
  useFirestore: jest.fn(() => ({
    collection: jest.fn(),
  })),
  useAuth: jest.fn(() => ({})),
}));

describe('Form Submissions', () => {
  describe('Create Post Form', () => {
    it('should render create post form', () => {
      render(<CreatePost />);
      expect(screen.getByPlaceholderText(/what's on your mind/i)).toBeInTheDocument();
    });

    it('should validate empty post submission', async () => {
      const user = userEvent.setup();
      render(<CreatePost />);

      const postButton = screen.getByRole('button', { name: /post/i });
      
      // Button should be disabled when content is empty
      await waitFor(() => {
        expect(postButton).toBeDisabled();
      });
    });

    it('should allow typing in textarea', async () => {
      const user = userEvent.setup();
      render(<CreatePost />);

      const textarea = screen.getByPlaceholderText(/what's on your mind/i);
      await user.type(textarea, 'Test post content');

      expect(textarea).toHaveValue('Test post content');
    });

    it('should enable post button when content is entered', async () => {
      const user = userEvent.setup();
      render(<CreatePost />);

      const textarea = screen.getByPlaceholderText(/what's on your mind/i);
      const postButton = screen.getByRole('button', { name: /post/i });

      await user.type(textarea, 'Test post content');

      await waitFor(() => {
        expect(postButton).not.toBeDisabled();
      });
    });
  });
});

