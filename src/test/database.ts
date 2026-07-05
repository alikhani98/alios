import { AliosDatabase, DexieStorageAdapter } from "@/db/dexie";

export async function createTestStorage(): Promise<{
  database: AliosDatabase;
  storage: DexieStorageAdapter;
}> {
  const database = new AliosDatabase();
  await database.delete();
  await database.open();

  return {
    database,
    storage: new DexieStorageAdapter(database),
  };
}

export async function destroyTestDatabase(
  database: AliosDatabase
): Promise<void> {
  database.close();
  await database.delete();
}
