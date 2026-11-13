// Tiny text helpers shared by the matcher and intents.
const STOP = new Set(["the", "a", "an", "is", "are", "do", "does", "you", "your", "i", "me", "my", "to", "of", "for", "in", "on", "at", "and", "or", "it", "what", "how", "much", "can", "please", "hi", "hello", "ka", "ki", "ke", "hai", "kya", "mein", "aap"]);
export const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
export const tokens = (s: string) => normalize(s).split(" ").filter((t) => t && !STOP.has(t));
export const includesAny = (text: string, words: string[]) => { const n = normalize(text); return words.some((w) => n.includes(normalize(w))); };
