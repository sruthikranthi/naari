/**
 * Error reporting utilities
 * Supports multiple error tracking services (Sentry, LogRocket, etc.)
 */

interface ErrorContext {
  userId?: string;
  userEmail?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

class ErrorReporter {
  private isInitialized = false;
  private context: ErrorContext = {};

  /**
   * Initialize error reporting service
   */
  init(service: 'sentry' | 'logrocket' | 'none' = 'none', config?: any) {
    if (this.isInitialized) return;

    try {
      if (service === 'sentry' && typeof window !== 'undefined') {
        // Initialize Sentry
        // Example: Sentry.init({ dsn: config.dsn, ... })
        console.log('Error reporting initialized: Sentry');
        this.isInitialized = true;
      } else if (service === 'logrocket' && typeof window !== 'undefined') {
        // Initialize LogRocket
        // Example: LogRocket.init(config.appId)
        console.log('Error reporting initialized: LogRocket');
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize error reporting:', error);
    }
  }

  /**
   * Set user context for error reports
   */
  setUser(userId: string, email?: string) {
    this.context.userId = userId;
    this.context.userEmail = email;
    this.updateContext();
  }

  /**
   * Set additional context
   */
  setContext(context: ErrorContext) {
    this.context = { ...this.context, ...context };
    this.updateContext();
  }

  /**
   * Update context in error reporting service
   */
  private updateContext() {
    if (typeof window === 'undefined') return;

    try {
      if ((window as any).Sentry) {
        (window as any).Sentry.setUser({
          id: this.context.userId,
          email: this.context.userEmail,
        });
        (window as any).Sentry.setContext('app', this.context);
      }
    } catch (error) {
      console.error('Failed to update error reporting context:', error);
    }
  }

  /**
   * Report an error
   */
  captureException(error: Error, context?: ErrorContext) {
    const errorContext = {
      ...this.context,
      ...context,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', error, errorContext);
    }

    // Report to error tracking service
    try {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            custom: errorContext,
          },
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Report a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    try {
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureMessage(message, level);
      }
    } catch (error) {
      console.error('Failed to capture message:', error);
    }
  }
}

export const errorReporter = new ErrorReporter();

