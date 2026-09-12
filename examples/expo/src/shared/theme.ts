import { useStorage } from "@brushy/storage-react";

export const palette = {
  light: {
    background: "#f4f4f5",
    card: "#ffffff",
    border: "#e4e4e7",
    borderStrong: "#d4d4d8",
    text: "#18181b",
    muted: "#71717a",
    faint: "#a1a1aa",
    avatar: "#e4e4e7",
    avatarText: "#3f3f46",
    buttonBg: "#ffffff",
    buttonText: "#3f3f46",
    divider: "#f4f4f5",
  },
  dark: {
    background: "#09090b",
    card: "#18181b",
    border: "#27272a",
    borderStrong: "#3f3f46",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    faint: "#71717a",
    avatar: "#27272a",
    avatarText: "#e4e4e7",
    buttonBg: "#18181b",
    buttonText: "#e4e4e7",
    divider: "#27272a",
  },
} as const;

export type ThemeMode = "light" | "dark";

export function themeColors(isDark: boolean) {
  return palette[isDark ? "dark" : "light"];
}

export function useAppTheme() {
  const { value: theme, set: setTheme } = useStorage("ui:theme", "light");
  const isDark = theme === "dark";

  return {
    theme,
    isDark,
    setTheme,
    colors: themeColors(isDark),
  };
}
