export interface BinaryStorage {
  save(storageKey: string, value: Blob): Promise<void>;
  retrieve(storageKey: string): Promise<Blob | undefined>;
  has(storageKey: string): Promise<boolean>;
  listKeys(): Promise<string[]>;
  /** Attachment storage retains content while any attachment metadata references it. */
  delete(storageKey: string): Promise<void>;
}
