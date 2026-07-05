import type { InboxItem } from "@/shared/types";

export type CreateInboxItemInput = Pick<InboxItem, "content" | "type"> &
  Partial<Pick<InboxItem, "status">>;
export type UpdateInboxItemInput = Partial<
  Pick<InboxItem, "content" | "type" | "status">
>;

export interface InboxRepository {
  list(): Promise<InboxItem[]>;
  getById(id: string): Promise<InboxItem | undefined>;
  create(input: CreateInboxItemInput): Promise<InboxItem>;
  update(id: string, input: UpdateInboxItemInput): Promise<InboxItem>;
  delete(id: string): Promise<void>;
}
