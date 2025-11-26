/**
 * Unit tests for search utilities
 */

import {
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory,
} from '@/lib/search';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Search Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveSearchHistory', () => {
    it('should save search term to history', () => {
      saveSearchHistory('test search');
      const history = getSearchHistory();
      expect(history).toContain('test search');
    });

    it('should limit history to 10 items', () => {
      for (let i = 0; i < 15; i++) {
        saveSearchHistory(`search ${i}`);
      }
      const history = getSearchHistory();
      expect(history.length).toBeLessThanOrEqual(10);
    });

    it('should move duplicate searches to the top', () => {
      saveSearchHistory('first');
      saveSearchHistory('second');
      saveSearchHistory('first');
      const history = getSearchHistory();
      expect(history[0]).toBe('first');
    });
  });

  describe('getSearchHistory', () => {
    it('should return empty array when no history exists', () => {
      const history = getSearchHistory();
      expect(history).toEqual([]);
    });

    it('should return saved history', () => {
      saveSearchHistory('test');
      const history = getSearchHistory();
      expect(history).toContain('test');
    });
  });

  describe('clearSearchHistory', () => {
    it('should clear all search history', () => {
      saveSearchHistory('test');
      clearSearchHistory();
      const history = getSearchHistory();
      expect(history).toEqual([]);
    });
  });
});

