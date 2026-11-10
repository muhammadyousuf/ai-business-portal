// The AI service boundary. The bot responder calls this; nothing else does.
// Implementation plan (see docs/architecture.md §6):
//  1. retrieve(businessId, question) -> top-k knowledge chunks (Atlas Vector Search)
//  2. complete({ system, history, tools }) with the business's allowed tools
//  3. tools execute against the DB with businessId pinned; the model never sees raw prices without a tool call
export interface CompletionRequest { system: string; messages: { role: "user" | "assistant"; content: string }[]; tools: string[] }
export interface CompletionResult { text: string; toolCalls: { name: string; args: Record<string, unknown> }[]; confidence: number }

export interface AiProvider { complete(req: CompletionRequest): Promise<CompletionResult> }

export const noopProvider: AiProvider = {
  async complete() { return { text: "", toolCalls: [], confidence: 0 }; },
};
