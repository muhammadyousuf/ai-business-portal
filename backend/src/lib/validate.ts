import type { RequestHandler } from "express";
import type { ZodTypeAny, z } from "zod";

// Validates and replaces req.body / req.query / req.params with the parsed values.
export function validate<B extends ZodTypeAny = ZodTypeAny, Q extends ZodTypeAny = ZodTypeAny, P extends ZodTypeAny = ZodTypeAny>(s: { body?: B; query?: Q; params?: P }): RequestHandler {
  return (req, _res, next) => {
    try {
      if (s.body) req.body = s.body.parse(req.body ?? {});
      if (s.query) req.query = s.query.parse(req.query) as z.infer<Q>;
      if (s.params) req.params = s.params.parse(req.params) as z.infer<P>;
      next();
    } catch (e) { next(e); }
  };
}
