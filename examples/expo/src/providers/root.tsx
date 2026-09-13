import App from "../screens/App";
import { AppProviders } from "./app-providers";

export function Root() {
  return (
    <AppProviders>
      <App />
    </AppProviders>
  );
}
