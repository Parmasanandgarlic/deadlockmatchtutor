import { Component } from 'react';
import { Crosshair } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <Crosshair className="w-12 h-12 text-deadlock-accent mb-4" />
          <h2 className="text-xl font-bold text-deadlock-text mb-2">Something went wrong</h2>
          <p className="text-deadlock-text-dim mb-4 max-w-md">
            The application encountered an unexpected error. This might be caused by a network issue or invalid data.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="btn-primary"
          >
            Return to Home
          </button>
          {this.state.error && (
            <p className="mt-4 text-xs text-deadlock-muted font-mono max-w-lg break-all">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
