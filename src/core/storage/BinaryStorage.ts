export interface BinaryStorage {
  save(storageKey: string, value: Blob): Promise<void>;
  retrieve(storageKey: string): Promise<Blob | undefined>;
  delete(storageKey: string): Promise<void>;
}
