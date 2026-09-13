import { Moon, Sun } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "../shared/theme";

export function ThemeIndicator() {
  const { isDark, colors } = useAppTheme();

  return (
    <View
      accessibilityLabel={`Tema atual: ${isDark ? "escuro" : "claro"}`}
      style={styles.footer}
    >
      {isDark ? (
        <Moon size={16} color={colors.faint} strokeWidth={1.75} />
      ) : (
        <Sun size={16} color={colors.faint} strokeWidth={1.75} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
  },
});
