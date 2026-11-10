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

export function relativeTime(iso: string, now = new Date("2026-10-31T13:30:00Z")) {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
  ];
  let value = diff;
  let unit = "s";
  for (const [step, label] of units) {
    if (value < step) break;
    value = value / step;
    unit = label;
  }
  return `${Math.max(1, Math.floor(value))}${unit} ago`;
}

export const fmtUsd = (n: number) => `$${n.toLocaleString("en-US")}`;
export const fmtNum = (n: number) => n.toLocaleString("en-US");
