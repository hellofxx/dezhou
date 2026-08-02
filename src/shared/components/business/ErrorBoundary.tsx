import { Component, type ReactNode } from 'react';
import i18n from '@/i18n/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const t = i18n.t.bind(i18n);

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--felt-deep, #0e1a14)',
            color: 'var(--ivory, #f3ebd9)',
            fontFamily: 'var(--font-body, system-ui, sans-serif)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              padding: '2rem',
              borderRadius: 12,
              backgroundColor: 'var(--walnut, #241a10)',
              border: '1px solid var(--walnut-border, #4a3825)',
            }}
          >
            <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              {t('common.errorBoundary.title')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--ivory-dim, #cabf9f)', marginBottom: '1rem', lineHeight: 1.6 }}>
              {t('common.errorBoundary.description')}
            </p>
            {this.state.error && (
              <pre
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--ivory-muted, #8a8068)',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  padding: '0.75rem',
                  borderRadius: 6,
                  overflow: 'auto',
                  maxHeight: 120,
                  textAlign: 'left',
                  marginBottom: '1rem',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 8,
                  border: '1px solid var(--walnut-border, #4a3825)',
                  backgroundColor: 'var(--walnut-raised, #3a2a18)',
                  color: 'var(--ivory, #f3ebd9)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {t('common.errorBoundary.retry')}
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--brass, #c9a25e)',
                  color: '#1a1612',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {t('common.errorBoundary.reload')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
