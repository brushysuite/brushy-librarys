import { useInject, useInjectComponent } from "@brushy/di-react";
import { Users } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../../shared/theme";
import { USER_LIST, USER_SERVICE } from "../users.tokens";

export function UsersCard() {
  const userService = useInject(USER_SERVICE);
  const UserList = useInjectComponent(USER_LIST);
  const { colors } = useAppTheme();
  const users = userService.list();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Users size={16} color={colors.muted} strokeWidth={1.75} />
        <Text style={[styles.title, { color: colors.text }]}>Users</Text>
        <Text style={[styles.count, { color: colors.faint }]}>{users.length}</Text>
      </View>
      <View style={styles.body}>
        <UserList users={users} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
  },
  count: {
    marginLeft: "auto",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  body: {
    padding: 8,
  },
});
