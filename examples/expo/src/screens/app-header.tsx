import { Moon, Sun } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../shared/theme";

export function AppHeader() {
  const { isDark, setTheme, colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>brushy-example</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>expo · di · storage</Text>
      </View>

      <Pressable
        accessibilityLabel={isDark ? "Usar tema claro" : "Usar tema escuro"}
        accessibilityRole="button"
        onPress={() => setTheme(isDark ? "light" : "dark")}
        style={({ pressed }) => [
          styles.themeButton,
          {
            backgroundColor: colors.buttonBg,
            borderColor: colors.borderStrong,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {isDark ? (
          <Sun size={16} color={colors.buttonText} strokeWidth={1.75} />
        ) : (
          <Moon size={16} color={colors.buttonText} strokeWidth={1.75} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 32,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
