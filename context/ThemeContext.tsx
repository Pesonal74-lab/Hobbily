/**
 * ThemeContext
 * Provides light/dark color tokens to the entire app.
 *
 * On mount the theme is initialised from the device's system preference
 * (Appearance.getColorScheme). The user can override it at any time via
 * toggleTheme(), which is exposed on the Profile screen.
 *
 * All UI components should consume `colors` from useTheme() rather than
 * hardcoding hex values — this ensures dark mode works globally.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

// ── Color palettes ────────────────────────────────────────────────────────────

const lightTheme = {
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  secondaryText: "#374151",
  border: "#E5E7EB",
  primary: "#2563EB",
  danger: "#DC2626",
};

const darkTheme = {
  background: "#111827",
  card: "#1F2933",
  text: "#F9FAFB",
  secondaryText: "#D1D5DB",
  border: "#374151",
  primary: "#60A5FA",
  danger: "#F87171",
};

// ── Context type ──────────────────────────────────────────────────────────────

type ThemeContextType = {
  /** True when the dark palette is active */
  isDark: boolean;
  /** The currently active color tokens — use these everywhere instead of hardcoded values */
  colors: typeof lightTheme;
  /** Flips between dark and light mode */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersDark = Appearance.getColorScheme() === "dark";
  const [isDark, setIsDark] = useState(systemPrefersDark);

  // Keep in sync when the user changes their OS-level theme while the app is open
  useEffect(() => setIsDark(systemPrefersDark), [systemPrefersDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? darkTheme : lightTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Hook to consume ThemeContext — must be used inside ThemeProvider */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
