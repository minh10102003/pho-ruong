import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

// Middleware validate request body bằng Zod schema
export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Dữ liệu không hợp lệ',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };

// Middleware xử lý lỗi toàn cục
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Lỗi máy chủ nội bộ',
  });
};
