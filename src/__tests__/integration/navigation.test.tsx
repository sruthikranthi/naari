/**
 * Integration tests for navigation flows
 */

import { render, screen } from '@/__tests__/utils/test-utils';
import { MainNav } from '@/components/main-nav';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard'),
}));

describe('Navigation Flows', () => {
  describe('MainNav', () => {
    it('should render all navigation items', () => {
      render(<MainNav />);
      
      expect(screen.getByLabelText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/communities/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/marketplace/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/chat/i)).toBeInTheDocument();
    });

    it('should have accessible navigation links', () => {
      render(<MainNav />);
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link).toHaveAttribute('aria-label');
      });
    });
  });
});

