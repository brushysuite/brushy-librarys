import { setInjectComponentErrorRenderer } from "@brushy/di-react";
import { StyleSheet, Text, View } from "react-native";

setInjectComponentErrorRenderer((message, details) => (
  <View style={styles.errorBox}>
    <Text style={styles.errorTitle}>{message}</Text>
    {details ? <Text style={styles.errorDetails}>{details}</Text> : null}
  </View>
));

const styles = StyleSheet.create({
  errorBox: {
    padding: 12,
    backgroundColor: "#fee",
    borderRadius: 8,
  },
  errorTitle: {
    fontWeight: "600",
    color: "#900",
  },
  errorDetails: {
    marginTop: 4,
    color: "#600",
  },
});
