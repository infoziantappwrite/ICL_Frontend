// src/context/ToastContext.jsx
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

let idCounter = 0;

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: {
    container: 'border-l-4 border-green-500 bg-white',
    icon:      'text-green-500',
    title:     'text-green-800',
    message:   'text-green-700',
    progress:  'bg-green-500',
  },
  error: {
    container: 'border-l-4 border-red-500 bg-white',
    icon:      'text-red-500',
    title:     'text-red-800',
    message:   'text-red-700',
    progress:  'bg-red-500',
  },
  warning: {
    container: 'border-l-4 border-amber-500 bg-white',
    icon:      'text-amber-500',
    title:     'text-amber-800',
    message:   'text-amber-700',
    progress:  'bg-amber-500',
  },
  info: {
    container: 'border-l-4 border-blue-500 bg-white',
    icon:      'text-blue-500',
    title:     'text-blue-800',
    message:   'text-blue-700',
    progress:  'bg-blue-500',
  },
};

const ToastItem = ({ toast, onRemove }) => {
  const style  = STYLES[toast.type] || STYLES.info;
  const Icon   = ICONS[toast.type]  || Info;
  const duration = toast.duration || 4000;

  return (
    <div
      className={`
        relative w-full max-w-sm pointer-events-auto
        rounded-xl shadow-xl overflow-hidden
        ${style.container}
        animate-toast-in
      `}
      role="alert"
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`text-sm font-semibold leading-tight ${style.title}`}>{toast.title}</p>
          )}
          {toast.message && (
            <p className={`text-sm leading-snug mt-0.5 ${style.message}`}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${style.progress} animate-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const remove = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type, titleOrOptions, message, opts = {}) => {
    let title, msg, options;
    if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
      // toast('success', { title, message, duration })
      ({ title, message: msg, ...options } = titleOrOptions);
    } else {
      title   = titleOrOptions;
      msg     = message;
      options = opts;
    }

    const id       = ++idCounter;
    const duration = options.duration ?? 4000;
    const newToast = { id, type, title, message: msg, duration };

    setToasts(prev => {
      // Max 5 toasts at once
      const next = [...prev, newToast];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });

    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => remove(id), duration);
    }
    return id;
  }, [remove]);

  const success = useCallback((title, message, opts) => toast('success', title, message, opts), [toast]);
  const error   = useCallback((title, message, opts) => toast('error',   title, message, opts), [toast]);
  const warning = useCallback((title, message, opts) => toast('warning', title, message, opts), [toast]);
  const info    = useCallback((title, message, opts) => toast('info',    title, message, opts), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, remove }}>
      {children}

      {/* Toast container — top-right, above everything */}
      <div
        aria-live="polite"
        className="fixed top-20 right-4 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
        style={{ maxWidth: '24rem', width: 'calc(100vw - 2rem)' }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-toast-in {
          animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .animate-progress {
          animation: progress linear forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};