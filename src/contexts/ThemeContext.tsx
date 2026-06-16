import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
interface Ctx { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void; }
const ThemeCtx = createContext<Ctx | null>(null);
const KEY = "trendsync:theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(KEY) as Theme | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")), setTheme: setThemeState }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
