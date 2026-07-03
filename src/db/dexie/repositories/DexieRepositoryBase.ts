import { AppError, NotFoundError, RepositoryError, ValidationError } from "@/core/errors";
import type { AliosDatabase } from "../db";
import { ZodError } from "zod";

export abstract class DexieRepositoryBase {
  protected constructor(protected readonly database: AliosDatabase) {}

  protected async execute<T>(
    operation: string,
    action: () => Promise<T>
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof ZodError) {
        throw new ValidationError(`Invalid data while ${operation}.`, {
          cause: error,
        });
      }

      throw new RepositoryError(`Failed while ${operation}.`, {
        cause: error,
      });
    }
  }

  protected requireEntity<T>(
    entity: string,
    identifier: string,
    value: T | undefined
  ): T {
    if (value === undefined) {
      throw new NotFoundError(entity, identifier);
    }

    return value;
  }

  protected createMetadata() {
    const timestamp = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  protected unavailable(operation: string): never {
    throw new RepositoryError(
      `${operation} is outside the Stage 5 CRUD foundation.`,
      { code: "REPOSITORY_OPERATION_NOT_IMPLEMENTED" }
    );
  }
}
