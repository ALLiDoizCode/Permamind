import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log errors in development only
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-terminal-bg text-terminal-text flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-terminal-surface border border-syntax-red rounded-lg p-6">
            <h1 className="text-2xl font-bold text-syntax-red mb-4">
              Something went wrong
            </h1>
            <p className="text-terminal-muted mb-4">
              An error occurred while rendering this component.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="bg-terminal-bg border border-terminal-border rounded p-4 text-xs overflow-auto max-h-48 text-syntax-red">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-syntax-blue text-terminal-bg px-4 py-2 rounded hover:bg-[#5299d9] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
