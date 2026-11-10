import type { EmbedOptions } from "./types";

// Reads options from the <script> tag that loaded the widget:
//   <script src="https://cdn.assistflow.app/widget.js" data-business="pk_live_…" data-api="https://api.assistflow.app" async></script>
// Optional: data-position="bottom-left" data-open="true" data-brand="#d9471f"
export function readEmbedOptions(): EmbedOptions {
  const el =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>('script[data-business][src*="widget"], script[data-business][src*="embed"]');
  const d = el?.dataset ?? {};
  const url = new URL(window.location.href);
  return {
    businessKey: d.business ?? url.searchParams.get("business") ?? "",
    apiBase: (d.api ?? url.searchParams.get("api") ?? "http://localhost:4000").replace(/\/$/, ""),
    position: (d.position as EmbedOptions["position"]) ?? "bottom-right",
    openOnLoad: d.open === "true",
    brand: d.brand,
  };
}
