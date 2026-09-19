export interface BinaryStorage {
  save(storageKey: string, value: Blob): Promise<void>;
  retrieve(storageKey: string): Promise<Blob | undefined>;
  has(storageKey: string): Promise<boolean>;
  listKeys(): Promise<string[]>;
  delete(storageKey: string): Promise<void>;
}
