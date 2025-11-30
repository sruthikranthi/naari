'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type CashfreeMode = 'sandbox' | 'production';

type CheckoutTarget = '_self' | '_blank' | '_top' | '_parent';

const DEFAULT_SCRIPT_URL =
  process.env.NEXT_PUBLIC_CASHFREE_SDK_URL ??
  'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.js';

const DEFAULT_MODE: CashfreeMode =
  process.env.NEXT_PUBLIC_CASHFREE_MODE?.toLowerCase() === 'production'
    ? 'production'
    : 'sandbox';

export function useCashfreeCheckout(mode: CashfreeMode = DEFAULT_MODE) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cashfreeRef = useRef<ReturnType<NonNullable<typeof window.Cashfree>> | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.Cashfree) {
      cashfreeRef.current = window.Cashfree({ mode });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Cashfree SDK readiness needs to be reflected immediately when the script already exists.
      setIsReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = DEFAULT_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        cashfreeRef.current = window.Cashfree({ mode });
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Cashfree SDK readiness should be updated once the script finishes loading.
        setIsReady(true);
      } else {
        setError('Cashfree SDK did not initialize correctly.');
      }
    };
    script.onerror = () => {
      setError('Failed to load Cashfree SDK.');
    };

    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [mode]);

  const openCheckout = useCallback(
    async (paymentSessionId: string, redirectTarget: CheckoutTarget = '_self') => {
      if (!cashfreeRef.current) {
        throw new Error('Cashfree SDK is not ready yet.');
      }

      await cashfreeRef.current.checkout({
        paymentSessionId,
        redirectTarget,
      });
    },
    []
  );

  return {
    isReady,
    error,
    openCheckout,
  };
}
