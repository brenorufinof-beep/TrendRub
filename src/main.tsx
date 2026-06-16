import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initializeSupabaseAuthState } from "./lib/api";

const root = createRoot(document.getElementById("root")!);

void initializeSupabaseAuthState().finally(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
