'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary component for graceful error handling
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Always log error to console for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler (e.g., for error reporting)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service if available
    this.reportError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Report to error tracking service (Sentry, LogRocket, etc.)
    // This will be implemented when error reporting is set up
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We&apos;re sorry, but something unexpected happened. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <Alert variant="destructive">
                  <AlertTitle>Error Details</AlertTitle>
                  <AlertDescription className="mt-2">
                    <pre className="text-xs overflow-auto max-h-48 p-2 bg-muted rounded">
                      <div className="font-semibold mb-2">Error Message:</div>
                      <div className="mb-2">{this.state.error.message || this.state.error.toString()}</div>
                      {this.state.error.stack && (
                        <>
                          <div className="font-semibold mb-2 mt-4">Stack Trace:</div>
                          <div className="mb-2 whitespace-pre-wrap">{this.state.error.stack}</div>
                        </>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <>
                          <div className="font-semibold mb-2 mt-4">Component Stack:</div>
                          <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                        </>
                      )}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to trigger error boundary from functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
}

