export type AppErrorOptions = {
  code?: string;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "APP_ERROR";
    this.cause = options.cause;
  }
}
