import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

interface ValidationTargets {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

export const validate = (targets: ValidationTargets) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (targets.body) {
        req.body = await targets.body.parseAsync(req.body);
      }
      if (targets.query) {
        const parsed = (await targets.query.parseAsync(req.query)) as any;
        for (const key of Object.keys(req.query)) {
          delete (req.query as any)[key];
        }
        Object.assign(req.query, parsed);
      }
      if (targets.params) {
        req.params = (await targets.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
};
