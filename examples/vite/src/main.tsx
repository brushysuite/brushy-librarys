import { createRoot } from "react-dom/client";
import "./index.css";
import { Root } from "./providers/root";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(<Root />);
