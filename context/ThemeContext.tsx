import { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

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

type ThemeContextType = {
  isDark: boolean;
  colors: typeof lightTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemPrefersDark = Appearance.getColorScheme() === "dark";
  const [isDark, setIsDark] = useState(systemPrefersDark);

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

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
