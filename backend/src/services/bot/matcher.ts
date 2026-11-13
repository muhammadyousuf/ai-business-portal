import { normalize, tokens } from "../../lib/text.js";

export interface QaLike { id: string; question: string; answer: string; keywords?: string[] }

// Scores a configured Q&A against a customer message: keyword hits weigh most, then token overlap with the question.
export function scoreQa(message: string, qa: QaLike) {
  const msg = normalize(message); const msgTokens = new Set(tokens(message));
  if (!msgTokens.size && !msg) return 0;
  let score = 0;
  for (const k of qa.keywords ?? []) { const nk = normalize(k); if (nk && msg.includes(nk)) score += 3; }
  const qTokens = tokens(qa.question);
  const overlap = qTokens.filter((t) => msgTokens.has(t)).length;
  if (qTokens.length) score += (overlap / qTokens.length) * 4 + (overlap / Math.max(1, msgTokens.size)) * 2;
  if (msg === normalize(qa.question)) score += 5;
  return score;
}

export function bestQa<T extends QaLike>(message: string, qas: T[], threshold = 2.4) {
  let best: { qa: T; score: number } | null = null;
  for (const qa of qas) { const s = scoreQa(message, qa); if (s > (best?.score ?? 0)) best = { qa, score: s }; }
  return best && best.score >= threshold ? best : null;
}
