import React, { Component, ErrorInfo, ReactNode } from 'react';
import { safeStorage } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled app error:', error, errorInfo);
  }

  private handleReset = () => {
    safeStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main className="center" style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: 480, margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ color: '#b91c1c', marginTop: 0 }}>⚠️ Παρουσιάστηκε σφάλμα / An error occurred</h2>
            <p style={{ color: '#64748b', fontSize: '.9rem', margin: '1rem 0' }}>
              {this.state.error?.message || 'Unexpected application error.'}
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="secondary"
              >
                🔄 Επαναφόρτωση / Reload
              </button>
              <button
                type="button"
                onClick={this.handleReset}
              >
                🔑 Σύνδεση / Sign in
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
