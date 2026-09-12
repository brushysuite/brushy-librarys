import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../../shared/theme";
import type { User } from "../user.service";

export type UserListProps = {
  users: User[];
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserList({ users }: UserListProps) {
  const { colors } = useAppTheme();

  return (
    <View>
      {users.map((user, index) => (
        <View key={user.id}>
          {index > 0 ? (
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          ) : null}
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colors.avatar }]}>
              <Text style={[styles.avatarText, { color: colors.avatarText }]}>
                {initials(user.name)}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={[styles.id, { color: colors.muted }]} numberOfLines={1}>
                id {user.id}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "500",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
  },
  id: {
    fontSize: 12,
    marginTop: 2,
  },
});
