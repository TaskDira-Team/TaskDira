import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito";

if (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === "true") {
  const { seedPreview } = await import("./data/previewSample");
  seedPreview();
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
