import { AppError, type AppErrorOptions } from "./AppError";

export class ValidationError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "VALIDATION_ERROR", ...options });
    this.name = "ValidationError";
  }
}
