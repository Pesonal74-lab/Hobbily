/**
 * ThemeContext
 * Light:  background #F5F5F5 · primary #2563EB · cards #FFFFFF · text #111827
 * Dark:   background #0F172A · primary #3B82F6 · cards #1E293B · text #F1F5F9
 */
import { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

const lightTheme = {
  background: "#F5F5F5",
  card: "#FFFFFF",
  text: "#111827",
  secondaryText: "#6B7280",
  border: "#E5E7EB",
  primary: "#2563EB",
  secondary: "#EFF6FF",
  accent: "#1D4ED8",
  danger: "#EF4444",
  success: "#10B981",
  tabBar: "#FFFFFF",
  tabBarActive: "#2563EB",
  tabBarInactive: "#9CA3AF",
  inputBackground: "#F9FAFB",
};

const darkTheme = {
  background: "#0F172A",
  card: "#1E293B",
  text: "#F1F5F9",
  secondaryText: "#94A3B8",
  border: "#334155",
  primary: "#3B82F6",
  secondary: "#1E3A5F",
  accent: "#60A5FA",
  danger: "#F87171",
  success: "#34D399",
  tabBar: "#1E293B",
  tabBarActive: "#3B82F6",
  tabBarInactive: "#64748B",
  inputBackground: "#0F172A",
};

export type ColorTokens = typeof lightTheme;

type ThemeContextType = {
  isDark: boolean;
  colors: ColorTokens;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersDark = Appearance.getColorScheme() === "dark";
  const [isDark, setIsDark] = useState(systemPrefersDark);

  useEffect(() => setIsDark(systemPrefersDark), [systemPrefersDark]);

  return (
    <ThemeContext.Provider
      value={{ isDark, colors: isDark ? darkTheme : lightTheme, toggleTheme: () => setIsDark((p) => !p) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
