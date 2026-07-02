import type { Task } from "@/shared/types";

export type CreateTaskInput = Omit<
  Task,
  "id" | "createdAt" | "updatedAt" | "completedAt"
>;

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  completedAt?: string;
};

export interface TasksRepository {
  list(): Promise<Task[]>;
  getById(id: string): Promise<Task | undefined>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
}
