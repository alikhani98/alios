import { RepositoryError } from "@/core/errors";
import type { AliosDatabase } from "../db";

export abstract class DexieRepositoryBase {
  protected constructor(protected readonly database: AliosDatabase) {}

  protected unavailable(operation: string): never {
    throw new RepositoryError(
      `${operation} is not available in the Stage 4 repository foundation.`,
      { code: "REPOSITORY_OPERATION_NOT_IMPLEMENTED" }
    );
  }
}
