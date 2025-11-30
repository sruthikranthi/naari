type CashfreeCheckoutConfig = {
  mode: 'sandbox' | 'production';
};

type CashfreeCheckoutOptions = {
  paymentSessionId: string;
  redirectTarget?: '_self' | '_blank' | '_top' | '_parent';
};

type CashfreeCheckoutInstance = {
  checkout: (options: CashfreeCheckoutOptions) => Promise<void> | void;
};

type CashfreeInitializer = (config: CashfreeCheckoutConfig) => CashfreeCheckoutInstance;

declare global {
  interface Window {
    Cashfree?: CashfreeInitializer;
  }
}

export {};
