const line = (level: string, msg: string, meta?: unknown) => JSON.stringify({ level, msg, ...(meta ? { meta } : {}), t: new Date().toISOString() });
const quiet = process.env.NODE_ENV === "test";
export const log = {
  info: (msg: string, meta?: unknown) => { if (!quiet) console.log(line("info", msg, meta)); },
  warn: (msg: string, meta?: unknown) => { if (!quiet) console.warn(line("warn", msg, meta)); },
  error: (msg: string, meta?: unknown) => console.error(line("error", msg, meta)),
};
