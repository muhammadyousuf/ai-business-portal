import "dotenv/config";

const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGODB_URI || undefined,
  portalOrigins: list(process.env.PORTAL_ORIGINS),
  botDevOrigins: list(process.env.BOT_DEV_ORIGINS),
  ai: { provider: process.env.AI_PROVIDER ?? "anthropic", apiKey: process.env.AI_API_KEY || undefined },
};
