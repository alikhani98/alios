import type { CreateRoutineInput, RoutinesRepository, UpdateRoutineInput } from "@/core/repositories";
import { routineSchema, type Routine } from "@/shared/types";
import type { AliosDatabase } from "../db";
import { DexieRepositoryBase } from "./DexieRepositoryBase";

export class DexieRoutinesRepository extends DexieRepositoryBase implements RoutinesRepository {
  constructor(database: AliosDatabase) { super(database); }
  async list(): Promise<Routine[]> { return this.execute("listing routines", async () => (await this.database.routines.toArray()).map((record) => routineSchema.parse(record))); }
  async create(input: CreateRoutineInput): Promise<Routine> { return this.execute("creating a routine", async () => { const routine = routineSchema.parse({ ...input, weekdays: [...new Set(input.weekdays)].sort(), ...this.createMetadata() }); await this.database.routines.add(routine); return routine; }); }
  async update(id: string, input: UpdateRoutineInput): Promise<Routine> { return this.execute("updating a routine", () => this.database.transaction("rw", this.database.routines, async () => { const current = this.requireEntity("Routine", id, await this.database.routines.get(id)); const routine = routineSchema.parse({ ...current, ...input, id: current.id, createdAt: current.createdAt, weekdays: input.weekdays ? [...new Set(input.weekdays)].sort() : current.weekdays, updatedAt: new Date().toISOString() }); await this.database.routines.put(routine); return routine; })); }
  async delete(id: string): Promise<void> { return this.execute("deleting a routine", () => this.database.transaction("rw", this.database.routines, async () => { this.requireEntity("Routine", id, await this.database.routines.get(id)); await this.database.routines.delete(id); })); }
}
