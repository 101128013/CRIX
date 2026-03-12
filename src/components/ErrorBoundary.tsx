import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<Props>, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      
      try {
        // Check if it's a Firestore error JSON
        const firestoreError = JSON.parse(this.state.error?.message || "");
        if (firestoreError.error) {
          errorMessage = `Database Error: ${firestoreError.error}. Please check your connection or permissions.`;
        }
      } catch (e) {
        // Not a JSON error
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="h-screen w-screen bg-industrial-ink flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6">
            <h2 className="text-industrial-bg font-display text-2xl tracking-tighter uppercase">System Malfunction</h2>
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-sm">
              <p className="text-red-400 font-mono text-xs leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-industrial-bg text-industrial-ink font-mono text-[10px] uppercase tracking-widest hover:bg-white transition-colors"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
