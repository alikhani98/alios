import { AppError, type AppErrorOptions } from "./AppError";

export class RepositoryError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "REPOSITORY_ERROR", ...options });
    this.name = "RepositoryError";
  }
}
