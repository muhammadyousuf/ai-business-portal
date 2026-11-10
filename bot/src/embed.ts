// Entry point of widget.js. Runs once per page, mounts the widget inside a
// Shadow DOM so the host site's CSS and ours never interfere.
import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { App } from "./widget/App";
import { readEmbedOptions } from "./config";
import styles from "./widget/styles.css?inline";

declare global { interface Window { AssistFlow?: { open(): void; close(): void; version: string } } }

(function mount() {
  if (document.getElementById("assistflow-widget")) return;
  const options = readEmbedOptions();
  if (!options.businessKey) { console.warn("[AssistFlow] missing data-business on the script tag"); return; }
  const host = document.createElement("div");
  host.id = "assistflow-widget";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  shadow.appendChild(style);
  const container = document.createElement("div");
  shadow.appendChild(container);
  createRoot(container).render(createElement(App, { options }));
  window.AssistFlow = { version: "0.1.0", open: () => shadow.querySelector<HTMLButtonElement>(".af-launcher[aria-label='Open chat']")?.click(), close: () => shadow.querySelector<HTMLButtonElement>(".af-launcher[aria-label='Close chat']")?.click() };
})();
