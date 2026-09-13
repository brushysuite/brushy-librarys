import { StrictMode } from "react";
import App from "../app/App";
import { AppProviders } from "./app-providers";

export function Root() {
  return (
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>
  );
}
