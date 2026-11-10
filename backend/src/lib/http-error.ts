export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
export const notImplemented = (routes: string[]) =>
  new HttpError(501, "Not implemented yet", { plannedRoutes: routes });
