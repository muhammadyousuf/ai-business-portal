// Tiny text helpers shared by the matcher and intents.
const STOP = new Set(["the", "a", "an", "is", "are", "do", "does", "you", "your", "i", "me", "my", "to", "of", "for", "in", "on", "at", "and", "or", "it", "what", "how", "much", "can", "please", "hi", "hello", "ka", "ki", "ke", "hai", "kya", "mein", "aap"]);
export const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
export const tokens = (s: string) => normalize(s).split(" ").filter((t) => t && !STOP.has(t));
// Whole-word matching so "hi" never fires on "Karachi" or "hey" on "they". Single words also match longer forms
// when they are at least 5 letters ("deliver" → "delivery", "timing" → "timings"); phrases must appear verbatim.
export const includesAny = (text: string, words: string[]) => {
  const n = normalize(text); const padded = ` ${n} `; const toks = n.split(" ");
  return words.some((raw) => {
    const w = normalize(raw); if (!w) return false;
    if (w.includes(" ")) return padded.includes(` ${w} `);
    return toks.some((t) => t === w || t === `${w}s` || (w.length >= 5 && t.startsWith(w)));
  });
};
