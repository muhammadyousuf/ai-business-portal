// Cross-app links. Each app is deployed on its own origin.
const USER_APP = process.env.NEXT_PUBLIC_USER_APP_URL ?? "http://localhost:3000";
const BOT = process.env.NEXT_PUBLIC_BOT_URL ?? "http://localhost:5173";

export const userAppUrl = (businessSlug: string, path = "") => `${USER_APP}/${businessSlug}${path}`;
export const botDemoUrl = (businessSlug: string) => `${BOT}/?business=${businessSlug}`;
