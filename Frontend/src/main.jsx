import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { listenForInstallPrompt } from "./services/installPrompt";
import "./index.css";
import "./readable-text.css";
import "./redesign.css";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito";

if (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === "true") {
  const { seedPreview } = await import("./data/previewSample");
  seedPreview();
  const { restorePreviewProgress } = await import("./services/previewProgress");
  const { store } = await import("./services/store");
  restorePreviewProgress(store);
}

listenForInstallPrompt();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
