// Cross-app links. Each app is deployed on its own origin.
const ADMIN_APP = process.env.NEXT_PUBLIC_ADMIN_APP_URL ?? "http://localhost:3001";
const BOT = process.env.NEXT_PUBLIC_BOT_URL ?? "http://localhost:5173";

export const adminUrl = (path = "") => `${ADMIN_APP}${path}`;
export const botDemoUrl = (businessSlug: string) => `${BOT}/?business=${businessSlug}`;
