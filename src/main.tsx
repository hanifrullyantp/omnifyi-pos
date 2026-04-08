import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { getSupabase, hydrateSupabaseFromApi } from "./lib/supabaseClient";

const rootEl = document.getElementById("root")!;

void hydrateSupabaseFromApi().finally(() => {
  if (import.meta.env.PROD && !getSupabase()) {
    // eslint-disable-next-line no-console
    console.error("[supabase] Tidak ada URL/anon key dari bundle maupun /api/supabase-config — cek env Vercel & Root Directory.");
  }
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
