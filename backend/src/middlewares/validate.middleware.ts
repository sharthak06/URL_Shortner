import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/Errors/AppError.js";

type ValidateTarget = "body" | "params" | "query";

export const validate =
  (schema: ZodType, target: ValidateTarget = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const data = req[target];
    const result = schema.safeParse(data);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      return next(new AppError(errorMessages, 400));
    }

    // Cleaned/trimmed data
    if (target === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      req[target] = result.data;
    }
    next();
  };
