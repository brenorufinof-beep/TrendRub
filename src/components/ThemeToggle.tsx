import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Mudar para tema ${theme === "dark" ? "claro" : "escuro"}`}
      className={`relative flex items-center justify-center rounded-xl border bg-[var(--bg-elev)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-soft)] transition ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
      style={{ borderColor: "var(--border)" }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
