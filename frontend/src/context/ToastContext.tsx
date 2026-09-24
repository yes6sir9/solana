import { createContext, useCallback, useContext, useState } from "react";
import type { FC, ReactNode } from "react";

export type ToastVariant = "success" | "error" | "levelup" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastState | null>(null);

let nextId = 1;

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, variant === "levelup" ? 3200 : 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

function ToastCard({ toast }: { toast: Toast }) {
  const styles: Record<ToastVariant, string> = {
    success: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
    error: "border-red-400/40 bg-red-500/15 text-red-200",
    levelup:
      "border-amber-300/50 bg-gradient-to-r from-amber-500/25 to-purple-500/25 text-amber-100 animate-level-up",
    info: "border-purple-400/40 bg-purple-500/15 text-purple-100",
  };

  return (
    <div className={`glass rounded-xl px-4 py-3 shadow-lg text-sm font-medium border ${styles[toast.variant]}`}>
      {toast.variant === "levelup" ? "✨ " : ""}
      {toast.message}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
