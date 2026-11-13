import type { AdminUserDoc, CategoryDoc, MembershipDoc, OrganizationDoc, UserDoc } from "../models/index.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: { sub: string; email: string };
      user?: UserDoc;
      admin?: AdminUserDoc;
      org?: OrganizationDoc;
      category?: CategoryDoc;
      membership?: MembershipDoc;
    }
  }
}
export {};
