import type { EmbedOptions } from "./types";

// Reads options from the <script> tag that loaded the widget:
//   <script src="https://cdn.<domain>/widget.js" data-business="wk_…" data-api="https://api.<domain>" async></script>
// Optional: data-position="bottom-left" data-open="true" data-brand="#d9471f" data-branch="<branchId>"
export function readEmbedOptions(): EmbedOptions {
  const el = (document.currentScript as HTMLScriptElement | null) ?? document.querySelector<HTMLScriptElement>('script[data-business][src*="widget"], script[data-business][src*="embed"]');
  const d = el?.dataset ?? {};
  const url = new URL(window.location.href);
  return {
    businessKey: d.business ?? url.searchParams.get("business") ?? "",
    apiBase: (d.api ?? url.searchParams.get("api") ?? "http://localhost:4000").replace(/\/$/, ""),
    position: (d.position as EmbedOptions["position"]) ?? undefined,
    openOnLoad: d.open === "true" || url.searchParams.get("open") === "true",
    brand: d.brand,
    branchId: d.branch,
  };
}
