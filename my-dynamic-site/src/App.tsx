/* App.tsx */
import React, { useState, Suspense, useEffect } from "react";
import "./App.css";
import * as XLSX from 'xlsx';
// ленивый импорт MyApp (имя MyApp должно совпадать с компонентом/файлом)
const MyApp = React.lazy(() => import("./MyApp"));

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; error: Error | null };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Ошибка в ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
          <div className="text-red-700 text-xl font-bold mb-2">
            Произошла ошибка в приложении
          </div>
          <div className="bg-white border border-red-300 rounded p-4 text-red-800 max-w-xl break-all">
            {this.state.error.message}
          </div>
          <button
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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

const App: React.FC = () => {
  const [showApp, setShowApp] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setGlobalError(`Глобальная ошибка: ${event.message}`);
      console.error("Глобальная ошибка:", event.error || event.message);
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      setGlobalError(`Необработанное отклонение промиса: ${event.reason}`);
      console.error("Необработанное отклонение промиса:", event.reason);
    };

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", unhandledRejectionHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", unhandledRejectionHandler);
    };
  }, []);

  useEffect(() => {
    // Можно поставить короткую задержку или сразу показывать приложение
    setShowApp(true);
  }, []);

  if (globalError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-6">
        <div className="text-red-700 text-xl font-bold mb-2">Произошла критическая ошибка</div>
        <div className="bg-white border border-red-300 rounded p-4 text-red-800 max-w-xl break-all">
          {globalError}
        </div>
        <button
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Перезагрузить страницу
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {showApp ? (
          // Suspense обязательно нужен при React.lazy
          <Suspense fallback={<div className="p-6">Загрузка приложения...</div>}>
            <MyApp />
          </Suspense>
        ) : (
          <div className="loading-container flex flex-col items-center justify-center h-screen gap-6">
            <div className="loading-spinner w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-blue-700 animate-pulse">Загрузка Parsing App...</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
