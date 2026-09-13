import { vi } from "vitest";

vi.mock("react-native", () => ({
  StyleSheet: { create: (styles: object) => styles, hairlineWidth: 1 },
  Text: "Text",
  View: "View",
  Pressable: "Pressable",
}));

vi.mock("lucide-react-native", () => ({
  Moon: "Moon",
  Sun: "Sun",
  Users: "Users",
}));
