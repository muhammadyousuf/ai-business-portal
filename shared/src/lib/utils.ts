import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...opts,
  }).format(new Date(iso));
}

export function relativeTime(iso: string, now: Date = new Date()) {
  const diff = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  // Each step: how many of the previous unit make one of this unit.
  const units: [number, string][] = [[60, "m"], [60, "h"], [24, "d"], [7, "w"], [4.35, "mo"], [12, "y"]];
  let value = diff;
  let unit = "s";
  for (const [step, label] of units) {
    if (value < step) break;
    value = value / step;
    unit = label;
  }
  if (unit === "s") return value < 10 ? "just now" : `${Math.floor(value)}s ago`;
  return `${Math.max(1, Math.floor(value))}${unit} ago`;
}

export const fmtUsd = (n: number) => `$${n.toLocaleString("en-US")}`;
export const fmtNum = (n: number) => n.toLocaleString("en-US");
