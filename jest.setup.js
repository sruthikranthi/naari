// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock lucide-react icons - return a simple div component for all icons
jest.mock('lucide-react', () => {
  const React = require('react');
  const createMockIcon = (name) => {
    const MockIcon = ({ className, ...props }) =>
      React.createElement('div', {
        'data-testid': `icon-${name.toLowerCase()}`,
        className,
        ...props,
      });
    MockIcon.displayName = name;
    return MockIcon;
  };

  const icons = [
    'Home', 'Users', 'ShoppingBag', 'MessageSquare', 'Heart', 'Bell', 'Search',
    'Menu', 'X', 'ChevronRight', 'Settings', 'LogOut', 'User', 'Mail', 'Lock',
    'Eye', 'EyeOff', 'Calendar', 'MapPin', 'Phone', 'Globe', 'Briefcase',
    'Award', 'Shield', 'HeartHandshake', 'Ticket', 'MailCheck', 'Info',
    'Wifi', 'WifiOff', 'MessageCircle', 'Share2', 'BarChart',
  ];

  return icons.reduce((acc, icon) => {
    acc[icon] = createMockIcon(icon);
    return acc;
  }, {});
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Suppress console errors in tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}

// Polyfill fetch for Node environment (Node 18+ has native fetch)
// Node 20+ has native fetch, but Jest might need it mocked
global.Headers = class Headers {
  get() { return null; }
  has() { return false; }
  set() {}
};

if (typeof global.fetch === 'undefined') {
  // Create minimal fetch mock for tests
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new global.Headers(),
  }));
  global.Request = class Request {};
  global.Response = class Response {};
}

// Polyfill TransformStream for Node environment
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = class TransformStream {
    constructor() {
      this.readable = { getReader: () => ({}) }
      this.writable = { getWriter: () => ({}) }
    }
  }
}

