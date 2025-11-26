'use client';

import { useState, useCallback } from 'react';

interface ProgressState {
  isLoading: boolean;
  progress: number; // 0-100
  message?: string;
}

/**
 * Hook for managing progress indicators
 */
export function useProgress() {
  const [state, setState] = useState<ProgressState>({
    isLoading: false,
    progress: 0,
  });

  const start = useCallback((message?: string) => {
    setState({
      isLoading: true,
      progress: 0,
      message,
    });
  }, []);

  const update = useCallback((progress: number, message?: string) => {
    setState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message,
    }));
  }, []);

  const complete = useCallback(() => {
    setState({
      isLoading: false,
      progress: 100,
    });
    // Reset after a brief delay
    setTimeout(() => {
      setState({
        isLoading: false,
        progress: 0,
      });
    }, 500);
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    start,
    update,
    complete,
    reset,
  };
}

