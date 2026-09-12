import { useInjectComponent } from "@brushy/di-react";
import { StyleSheet, View } from "react-native";
import { USERS_CARD } from "../features/users/users.tokens";
import { useAppTheme } from "../shared/theme";
import { AppHeader } from "./app-header";
import { ThemeIndicator } from "./theme-indicator";

export default function App() {
  const UsersCard = useInjectComponent(USERS_CARD);
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <AppHeader />
        <UsersCard />
        <ThemeIndicator />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    maxWidth: 512,
    width: "100%",
    alignSelf: "center",
  },
});
