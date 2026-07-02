import { AppError, type AppErrorOptions } from "./AppError";

export class NotFoundError extends AppError {
  readonly entity: string;
  readonly identifier?: string;

  constructor(entity: string, identifier?: string, options: AppErrorOptions = {}) {
    const detail = identifier ? ` with identifier "${identifier}"` : "";
    super(`${entity}${detail} was not found`, { code: "NOT_FOUND", ...options });
    this.name = "NotFoundError";
    this.entity = entity;
    this.identifier = identifier;
  }
}
