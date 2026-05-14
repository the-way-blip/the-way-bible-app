import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, { icon, duration = 2000 } = {}) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="bg-warm-brown dark:bg-warm-brown-light text-white dark:text-warm-brown text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-toast-in"
          >
            {t.icon && <span className="text-base">{t.icon}</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
