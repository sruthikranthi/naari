/**
 * Unit tests for optimistic UI utilities
 */

import {
  createOptimisticUpdate,
  mergeOptimisticUpdates,
  removeOptimisticUpdate,
  cleanupOldOptimisticUpdates,
} from '@/lib/optimistic-ui';

interface TestItem {
  id: string;
  content: string;
}

describe('Optimistic UI Utilities', () => {
  describe('createOptimisticUpdate', () => {
    it('should create an optimistic update with temp ID', () => {
      const data = { id: 'real-id', content: 'test' };
      const update = createOptimisticUpdate<TestItem>(data);

      expect(update.tempId).toMatch(/^temp-/);
      expect(update.data).toEqual(data);
      expect(update.timestamp).toBeGreaterThan(0);
    });
  });

  describe('mergeOptimisticUpdates', () => {
    it('should merge optimistic updates with real data', () => {
      const optimistic = [
        createOptimisticUpdate<TestItem>({ id: 'temp-1', content: 'optimistic' }),
      ];
      const real: TestItem[] = [
        { id: 'real-1', content: 'real' },
      ];

      const merged = mergeOptimisticUpdates(optimistic, real, (item) => item.id);

      expect(merged.length).toBeGreaterThan(0);
    });

    it('should place optimistic items at the beginning', () => {
      const optimistic = [
        createOptimisticUpdate<TestItem>({ id: 'temp-1', content: 'optimistic' }),
      ];
      const real: TestItem[] = [
        { id: 'real-1', content: 'real' },
      ];

      const merged = mergeOptimisticUpdates(optimistic, real, (item) => item.id);

      // Optimistic items should be first
      expect(merged[0].content).toBe('optimistic');
    });
  });

  describe('removeOptimisticUpdate', () => {
    it('should remove update by temp ID', () => {
      const update1 = createOptimisticUpdate<TestItem>({ id: '1', content: 'test1' });
      const update2 = createOptimisticUpdate<TestItem>({ id: '2', content: 'test2' });
      const optimistic = [update1, update2];

      const result = removeOptimisticUpdate(optimistic, update1.tempId);

      expect(result.length).toBe(1);
      expect(result[0].tempId).toBe(update2.tempId);
    });
  });

  describe('cleanupOldOptimisticUpdates', () => {
    it('should remove updates older than max age', () => {
      const oldUpdate = createOptimisticUpdate<TestItem>({ id: '1', content: 'old' });
      // Manually set old timestamp
      oldUpdate.timestamp = Date.now() - 60000; // 1 minute ago

      const newUpdate = createOptimisticUpdate<TestItem>({ id: '2', content: 'new' });
      const optimistic = [oldUpdate, newUpdate];

      const result = cleanupOldOptimisticUpdates(optimistic, 30000); // 30 second max age

      expect(result.length).toBe(1);
      expect(result[0].tempId).toBe(newUpdate.tempId);
    });
  });
});

