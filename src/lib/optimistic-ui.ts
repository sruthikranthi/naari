/**
 * Optimistic UI update utilities
 * Allows immediate UI updates before server confirmation
 */

export interface OptimisticUpdate<T> {
  tempId: string;
  data: T;
  timestamp: number;
}

/**
 * Create an optimistic update with a temporary ID
 */
export function createOptimisticUpdate<T>(data: T): OptimisticUpdate<T> {
  return {
    tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    data,
    timestamp: Date.now(),
  };
}

/**
 * Merge optimistic updates with real data
 * Replaces temporary items with real ones when they arrive
 */
export function mergeOptimisticUpdates<T extends { id: string }>(
  optimistic: OptimisticUpdate<T>[],
  real: T[],
  getId: (item: T) => string = (item) => item.id
): T[] {
  const realMap = new Map(real.map(item => [getId(item), item]));
  const optimisticMap = new Map(
    optimistic.map(opt => [opt.tempId, opt.data])
  );

  // Start with real data
  const result: T[] = [...real];

  // Add optimistic updates that don't have real counterparts yet
  optimistic.forEach(opt => {
    // Check if this optimistic update has been confirmed
    const isConfirmed = Array.from(realMap.values()).some(
      realItem => JSON.stringify(realItem) === JSON.stringify(opt.data)
    );

    if (!isConfirmed) {
      // Add optimistic item at the beginning (most recent)
      result.unshift(opt.data);
    }
  });

  return result;
}

/**
 * Remove optimistic update by temp ID
 */
export function removeOptimisticUpdate<T>(
  optimistic: OptimisticUpdate<T>[],
  tempId: string
): OptimisticUpdate<T>[] {
  return optimistic.filter(opt => opt.tempId !== tempId);
}

/**
 * Clean up old optimistic updates (older than 30 seconds)
 */
export function cleanupOldOptimisticUpdates<T>(
  optimistic: OptimisticUpdate<T>[],
  maxAge: number = 30000
): OptimisticUpdate<T>[] {
  const now = Date.now();
  return optimistic.filter(opt => now - opt.timestamp < maxAge);
}

