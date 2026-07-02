import { AppError, type AppErrorOptions } from "./AppError";

export class StorageError extends AppError {
  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { code: "STORAGE_ERROR", ...options });
    this.name = "StorageError";
  }
}
