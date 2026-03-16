/**
 * ThemeContext
 * Light:  background #B8C4E4 (lavender) · primary #1B2D6B (dark navy) · cards #FFFFFF · accent #E86B5E (coral)
 * Dark:   background #1A1F35 · primary #4A6FD4 · cards #252D4A · accent #E86B5E
 *
 * Persistence: the user's choice is saved to AsyncStorage so it survives app restarts.
 * On first launch (no saved pref) we fall back to the system colour scheme.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@hobbily_theme";

const lightTheme = {
  background: "#B8C4E4",
  card: "#FFFFFF",
  text: "#1B2D6B",
  secondaryText: "#6B7594",
  border: "#A0ACCC",
  primary: "#1B2D6B",
  secondary: "#D5DCF0",
  accent: "#E86B5E",
  danger: "#E86B5E",
  success: "#10B981",
  tabBar: "#C8CEE8",
  tabBarActive: "#E86B5E",
  tabBarInactive: "#1B2D6B",
  inputBackground: "#D5DCF0",
};

const darkTheme = {
  background: "#1A1F35",
  card: "#252D4A",
  text: "#E8EAF6",
  secondaryText: "#8896B8",
  border: "#3A4466",
  primary: "#4A6FD4",
  secondary: "#2A3560",
  accent: "#E86B5E",
  danger: "#E86B5E",
  success: "#34D399",
  tabBar: "#1E2440",
  tabBarActive: "#E86B5E",
  tabBarInactive: "#8896B8",
  inputBackground: "#2A3560",
};

export type ColorTokens = typeof lightTheme;

type ThemeContextType = {
  isDark: boolean;
  colors: ColorTokens;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(Appearance.getColorScheme() === "dark");

  // On mount: load persisted preference (overrides system default if set)
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "dark") setIsDark(true);
      else if (saved === "light") setIsDark(false);
      // If null → keep system default already set in useState
    });
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkTheme : lightTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
