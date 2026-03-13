import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

export const ToastContext = React.createContext<ToastContextType | null>(null);

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (
    message: string, 
    type: ToastType = 'info', 
    duration: number = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const timeoutIds = toasts.map((toast) =>
      setTimeout(() => removeToast(toast.id), toast.duration)
    );

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [toasts]);

  const getIcon = (type: ToastType) => {
    const size = 20;
    switch (type) {
      case 'success': return <CheckCircle size={size} className="text-green-500" />;
      case 'error': return <XCircle size={size} className="text-red-500" />;
      case 'warning': return <Info size={size} className="text-yellow-500" />;
      case 'info': return <Info size={size} className="text-blue-500" />;
      default: return <Info size={size} />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-fadeInUp transform transition-all duration-300 
                        min-w-[300px] max-w-md border rounded-lg shadow-lg p-4 
                        flex items-start space-x-3 ${getBgColor(toast.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-500 transition-colors"
              aria-label="Close"
            >
              ✖
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a Toaster provider');
  }
  return context.toast;
};