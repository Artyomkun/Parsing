import React, { Component, ReactNode, ErrorInfo, CSSProperties } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="error-boundary" style={styles.container}>
          <h2 style={styles.title}>⚠️ Что-то пошло не так</h2>
          
          {this.state.error && (
            <div style={styles.errorDetails}>
              <p style={styles.errorMessage}>
                <strong>Ошибка:</strong> {this.state.error.message}
              </p>
              {this.state.errorInfo && (
                <details style={styles.details}>
                  <summary>Подробнее</summary>
                  <pre style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          <button 
            style={styles.button}
            onClick={() => window.location.reload()}
          >
            Перезагрузить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Используем тип CSSProperties для строгой типизации
const styles: Record<string, CSSProperties> = {
  container: {
    padding: '20px',
    border: '1px solid #ff6b6b',
    borderRadius: '8px',
    backgroundColor: '#fff5f5',
    maxWidth: '600px',
    margin: '20px auto',
    textAlign: 'center',
  },
  title: {
    color: '#ff6b6b',
    marginBottom: '15px',
  },
  errorDetails: {
    marginBottom: '15px',
  },
  errorMessage: {
    color: '#495057',
    lineHeight: 1.5, // Исправлено на число
  },
  details: {
    marginTop: '10px',
    textAlign: 'left',
  },
  stackTrace: {
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '4px',
    overflowX: 'auto' as const, // Явное приведение типа
    fontSize: '14px',
    maxHeight: '200px',
    overflowY: 'auto' as const, // Явное приведение типа
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  }
};

export default ErrorBoundary;