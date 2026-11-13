export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string, public details?: unknown) { super(message); }
}
export const badRequest = (m: string, details?: unknown) => new HttpError(400, m, "bad_request", details);
export const unauthorized = (m = "Sign in required") => new HttpError(401, m, "unauthorized");
export const forbidden = (m = "You do not have permission to do that") => new HttpError(403, m, "forbidden");
export const notFound = (m = "Not found") => new HttpError(404, m, "not_found");
export const conflict = (m: string) => new HttpError(409, m, "conflict");
