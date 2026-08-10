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
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h1>{t('common.errorBoundary.title')}</h1>
            <p>{t('common.errorBoundary.description')}</p>
            {this.state.error && <pre>{this.state.error.message}</pre>}
            <div className="error-boundary-actions">
              <button className="error-boundary-btn" onClick={this.handleReset}>
                {t('common.errorBoundary.retry')}
              </button>
              <button className="error-boundary-btn-primary" onClick={() => window.location.reload()}>
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
