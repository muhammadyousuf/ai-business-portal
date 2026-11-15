import "dotenv/config";

const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const req = (k: string) => { const v = process.env[k]; if (!v) throw new Error(`Missing env ${k}`); return v; };

const isTest = process.env.NODE_ENV === "test";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isTest,
  isDev: (process.env.NODE_ENV ?? "development") === "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: isTest ? (process.env.MONGODB_TEST_URI ?? "mongodb://127.0.0.1:27017/ai-business-portal-test") : req("MONGODB_URI"),
  supabase: {
    url: req("SUPABASE_URL"),
    jwksUrl: process.env.SUPABASE_JWKS_URL ?? `${req("SUPABASE_URL")}/auth/v1/.well-known/jwks.json`,
    serviceKey: req("SUPABASE_SERVICE_ROLE_KEY"),
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    jwtSecret: process.env.SUPABASE_JWT_SECRET || undefined,
  },
  urls: {
    userApp: process.env.USER_APP_URL ?? "http://localhost:3000",
    adminApp: process.env.ADMIN_APP_URL ?? "http://localhost:3001",
    api: process.env.API_PUBLIC_URL ?? "http://localhost:4000",
  },
  portalOrigins: list(process.env.PORTAL_ORIGINS),
  botDevOrigins: list(process.env.BOT_DEV_ORIGINS),
  cloudinary: process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    ? { cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY, apiSecret: process.env.CLOUDINARY_API_SECRET, uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined }
    : undefined,
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
};
