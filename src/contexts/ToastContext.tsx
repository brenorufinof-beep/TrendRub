import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

type ToastKind = "success" | "info" | "error";
interface Toast { id: string; kind: ToastKind; message: string; }
interface Ctx { notify: (message: string, kind?: ToastKind) => void; }
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[92vw] sm:max-w-sm">
        {toasts.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "info" ? Info : AlertTriangle;
          const accent =
            t.kind === "success" ? "var(--success)" : t.kind === "error" ? "var(--danger)" : "var(--primary)";
          return (
            <div
              key={t.id}
              className="glass animate-slide-up flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg"
              style={{ borderColor: "var(--border)" }}
              role="status"
            >
              <Icon size={20} style={{ color: accent }} />
              <p className="flex-1 text-sm">{t.message}</p>
              <button
                aria-label="Fechar"
                onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
                className="opacity-60 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
