import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { HttpError } from "../utils/error";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new HttpError(
          400,
          error.errors.map((err) => err.message).join(", ")
        );
      }
      throw new HttpError(500, "Terjadi kesalahan pada validasi");
    }
  };
};
