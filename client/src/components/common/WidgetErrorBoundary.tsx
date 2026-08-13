import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Widget Crash]', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="premium-card" style={{ padding: 'var(--spacing-xl, 24px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', backgroundColor: 'var(--bg-page)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <AlertTriangle size={32} color="var(--danger)" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Widget Failed to Load</h3>
          <p style={{ margin: '8px 0 0', fontSize: 'var(--font-base, 14px)', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {this.props.fallbackMessage || 'An unexpected error occurred while rendering this component.'}
          </p>
          <div style={{ marginTop: '12px', fontSize: 'var(--font-sm, 12px)', color: 'var(--danger)', textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', padding: 'var(--spacing-sm, 8px)', borderRadius: '4px', width: '100%', overflow: 'auto' }}>
            <strong>Error:</strong> {this.state.error?.message}
            <br />
            <strong>Component:</strong> {this.state.errorInfo?.componentStack?.split('\n')[1]?.trim() || 'Unknown'}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
            className="btn btn-outline" 
            style={{ marginTop: '16px', fontSize: 'var(--font-sm, 12px)', padding: '6px 12px' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
