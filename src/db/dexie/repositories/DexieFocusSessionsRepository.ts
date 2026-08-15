import type {
  CreateFocusSessionInput,
  FocusSessionsRepository,
} from "@/core/repositories";
import { focusSessionSchema, type FocusSession } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieFocusSessionsRepository
  extends DexieRepositoryBase
  implements FocusSessionsRepository
{
  constructor(database: AliosDatabase) {
    super(database);
  }

  async list(): Promise<FocusSession[]> {
    return this.execute("listing focus sessions", async () => {
      const records = await this.database.focusSessions
        .orderBy("startedAt")
        .reverse()
        .toArray();
      return records.map((record) => focusSessionSchema.parse(record));
    });
  }

  async create(input: CreateFocusSessionInput): Promise<FocusSession> {
    return this.execute("creating a focus session", async () => {
      const session = focusSessionSchema.parse({
        ...input,
        id: crypto.randomUUID(),
      });
      await this.database.focusSessions.add(session);
      return session;
    });
  }
}
