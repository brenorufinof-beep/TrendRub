import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";

// ============================================================
// Button
// ============================================================
type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "gradient";
type ButtonSize = "sm" | "md" | "lg" | "icon";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm",
  secondary: "bg-[var(--bg-soft)] text-[var(--text)] hover:bg-[var(--border)]",
  ghost: "text-[var(--text)] hover:bg-[var(--bg-soft)]",
  outline: "border border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:bg-[var(--bg-soft)]",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
  gradient: "bg-brand-gradient text-white shadow-md hover:shadow-lg hover:brightness-110",
};
const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
  icon: "h-10 w-10 rounded-xl flex items-center justify-center",
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

// ============================================================
// Card
// ============================================================
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-[var(--bg-elev)] shadow-[var(--shadow-sm)]",
        className
      )}
      style={{ borderColor: "var(--border)" }}
      {...props}
    />
  );
}

// ============================================================
// Avatar
// ============================================================
interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
}
export function Avatar({ src, name, size = 40, className, ring }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-[var(--bg-soft)] flex items-center justify-center font-semibold flex-shrink-0",
        ring && "ring-2 ring-offset-2 ring-[var(--primary)]",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38, color: "var(--text-muted)" }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

// ============================================================
// Badge
// ============================================================
interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "violet";
  className?: string;
}
export function Badge({ children, variant = "default", className }: BadgeProps) {
  const map: Record<string, string> = {
    default: "bg-[var(--bg-soft)] text-[var(--text-muted)]",
    success: "bg-emerald-500/15 text-emerald-500",
    warning: "bg-amber-500/15 text-amber-500",
    info: "bg-sky-500/15 text-sky-500",
    violet: "bg-violet-500/15 text-violet-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        map[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================================
// Input + Textarea
// ============================================================
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-10 rounded-xl border bg-[var(--bg)] px-3.5 text-sm placeholder:text-[var(--text-soft)] transition focus:bg-[var(--bg-elev)]",
        className
      )}
      style={{ borderColor: "var(--border)" }}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-h-[88px] rounded-xl border bg-[var(--bg)] px-3.5 py-2.5 text-sm placeholder:text-[var(--text-soft)] transition focus:bg-[var(--bg-elev)] resize-none",
        className
      )}
      style={{ borderColor: "var(--border)" }}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ============================================================
// Modal (Dialog)
// ============================================================
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}
export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 w-full rounded-2xl border bg-[var(--bg-elev)] shadow-[var(--shadow-lg)] animate-slide-up",
          widths[size]
        )}
        style={{ borderColor: "var(--border)" }}
      >
        {title && (
          <div className="border-b px-5 py-4 font-semibold" id="modal-title" style={{ borderColor: "var(--border)" }}>
            {title}
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// Tabs
// ============================================================
interface TabsProps<T extends string> {
  tabs: { value: T; label: string; icon?: ReactNode; count?: number }[];
  active: T;
  onChange: (v: T) => void;
  className?: string;
}
export function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 rounded-xl border bg-[var(--bg-elev)] p-1", className)}
      style={{ borderColor: "var(--border)" }}
    >
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition",
              isActive
                ? "bg-brand-gradient text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-soft)]"
            )}
          >
            {t.icon}
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span className={cn("text-xs px-1.5 rounded-full", isActive ? "bg-white/25" : "bg-[var(--bg-soft)]")}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================
export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-2xl border border-dashed" style={{ borderColor: "var(--border-strong)" }}>
      <div className="h-14 w-14 rounded-2xl bg-[var(--bg-soft)] flex items-center justify-center mb-4" style={{ color: "var(--text-muted)" }}>
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {hint && <p className="text-sm text-[var(--text-muted)] max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
