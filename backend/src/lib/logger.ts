export const log = {
  info: (msg: string, meta?: unknown) => console.log(JSON.stringify({ level: "info", msg, ...(meta ? { meta } : {}), t: new Date().toISOString() })),
  warn: (msg: string, meta?: unknown) => console.warn(JSON.stringify({ level: "warn", msg, ...(meta ? { meta } : {}), t: new Date().toISOString() })),
  error: (msg: string, meta?: unknown) => console.error(JSON.stringify({ level: "error", msg, ...(meta ? { meta } : {}), t: new Date().toISOString() })),
};
