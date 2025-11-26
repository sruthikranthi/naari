/**
 * Unit tests for useProgress hook
 */

import { renderHook, act } from '@testing-library/react';
import { useProgress } from '@/hooks/use-progress';

describe('useProgress', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useProgress());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('should start loading', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.start('Loading...');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.progress).toBe(0);
    expect(result.current.message).toBe('Loading...');
  });

  it('should update progress', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.start();
      result.current.update(50, 'Halfway');
    });

    expect(result.current.progress).toBe(50);
    expect(result.current.message).toBe('Halfway');
  });

  it('should complete loading', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.start();
      result.current.complete();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.progress).toBe(100);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.progress).toBe(0);
    jest.useRealTimers();
  });

  it('should reset progress', () => {
    const { result } = renderHook(() => useProgress());

    act(() => {
      result.current.start();
      result.current.update(50);
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.progress).toBe(0);
  });
});

