import type {
  CreateInboxItemInput,
  InboxRepository,
  UpdateInboxItemInput,
} from "@/core/repositories";
import { notifyUserDataSyncTrigger } from "@/core/sync";
import { inboxItemSchema, type InboxItem } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";
import { DexieMutationOutboxRepository } from "./DexieMutationOutboxRepository";

export class DexieInboxRepository
  extends DexieRepositoryBase
  implements InboxRepository
{
  private readonly mutationOutbox: DexieMutationOutboxRepository;

  constructor(database: AliosDatabase) {
    super(database);
    this.mutationOutbox = new DexieMutationOutboxRepository(database);
  }

  async list(): Promise<InboxItem[]> {
    return this.execute("listing inbox items", async () => {
      const records = await this.database.inboxItems.toArray();
      return records.map((record) => inboxItemSchema.parse(record));
    });
  }

  async getById(id: string): Promise<InboxItem | undefined> {
    return this.execute("reading an inbox item", async () => {
      const record = await this.database.inboxItems.get(id);
      return record === undefined ? undefined : inboxItemSchema.parse(record);
    });
  }

  async create(input: CreateInboxItemInput): Promise<InboxItem> {
    return this.execute("creating an inbox item", () =>
      this.database.transaction(
        "rw",
        this.database.inboxItems,
        this.database.mutationOutbox,
        async () => {
          const item = inboxItemSchema.parse({
            status: "unprocessed",
            ...input,
            ...this.createMetadata(),
          });
          await this.database.inboxItems.add(item);
          await this.mutationOutbox.enqueue({
            entity: "inboxItems",
            operation: "create",
            recordId: item.id,
            payload: item,
          });
          notifyUserDataSyncTrigger({
            entity: "inboxItems",
            operation: "create",
          });
          return item;
        }
      )
    );
  }

  async update(id: string, input: UpdateInboxItemInput): Promise<InboxItem> {
    return this.execute("updating an inbox item", () =>
      this.database.transaction(
        "rw",
        this.database.inboxItems,
        this.database.mutationOutbox,
        async () => {
          const current = this.requireEntity(
            "Inbox item",
            id,
            await this.database.inboxItems.get(id)
          );
          const item = inboxItemSchema.parse({
            ...current,
            ...input,
            id: current.id,
            createdAt: current.createdAt,
            updatedAt: new Date().toISOString(),
          });
          await this.database.inboxItems.put(item);
          await this.mutationOutbox.enqueue({
            entity: "inboxItems",
            operation: "update",
            recordId: item.id,
            payload: item,
          });
          notifyUserDataSyncTrigger({
            entity: "inboxItems",
            operation: "update",
          });
          return item;
        }
      )
    );
  }

  async delete(id: string): Promise<void> {
    return this.execute("deleting an inbox item", () =>
      this.database.transaction(
        "rw",
        this.database.inboxItems,
        this.database.mutationOutbox,
        async () => {
          const current = this.requireEntity(
            "Inbox item",
            id,
            await this.database.inboxItems.get(id)
          );
          await this.database.inboxItems.delete(id);
          await this.mutationOutbox.enqueue({
            entity: "inboxItems",
            operation: "delete",
            recordId: current.id,
            payload: current,
          });
          notifyUserDataSyncTrigger({
            entity: "inboxItems",
            operation: "delete",
          });
        }
      )
    );
  }
}
