/**
 * ThemeContext
 * Provides light/dark color tokens to the entire app using the Hobbily palette.
 *
 * Palette:
 *   #fc7273  — coral/pink  (primary accent, buttons, active states)
 *   #cacef2  — soft lavender (secondary surfaces, chips, borders)
 *   #032068  — deep navy    (text, dark mode card backgrounds)
 *   #000000  — pure black   (dark mode background)
 *
 * On mount the theme is initialised from the device's system preference
 * (Appearance.getColorScheme). The user can override it at any time via
 * toggleTheme(), which is exposed on the Profile screen.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

// ── Color palettes ────────────────────────────────────────────────────────────

const lightTheme = {
  background: "#f5f6ff",      // near-white with a lavender tint
  card: "#ffffff",
  text: "#032068",            // deep navy for readability
  secondaryText: "#4a5a80",   // medium slate
  border: "#cacef2",          // lavender border
  primary: "#fc7273",         // coral/pink primary
  secondary: "#cacef2",       // lavender secondary
  accent: "#032068",          // navy accent
  danger: "#e53935",          // red for destructive actions
  success: "#2e7d32",         // green for success
  tabBar: "#ffffff",
  tabBarActive: "#fc7273",
  tabBarInactive: "#9ba8c8",
  inputBackground: "#eef0ff",
};

const darkTheme = {
  background: "#000000",      // pure black
  card: "#0d1b3e",            // very dark navy
  text: "#f0f2ff",            // light lavender-white
  secondaryText: "#cacef2",   // lavender for secondary text
  border: "#1a2d5a",          // dark navy border
  primary: "#fc7273",         // coral stays vibrant in dark mode
  secondary: "#1e2f60",       // dark navy-lavender
  accent: "#cacef2",          // lavender accent
  danger: "#fc7273",          // danger = primary in dark mode (vibrant red)
  success: "#4caf50",
  tabBar: "#0d1b3e",
  tabBarActive: "#fc7273",
  tabBarInactive: "#4a5a80",
  inputBackground: "#0a1530",
};

// ── Context type ──────────────────────────────────────────────────────────────

export type ColorTokens = typeof lightTheme;

type ThemeContextType = {
  isDark: boolean;
  colors: ColorTokens;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersDark = Appearance.getColorScheme() === "dark";
  const [isDark, setIsDark] = useState(systemPrefersDark);

  useEffect(() => setIsDark(systemPrefersDark), [systemPrefersDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkTheme : lightTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
