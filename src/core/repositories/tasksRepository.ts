import type { Task } from "@/shared/types";

export type CreateTaskInput = Omit<
  Task,
  "id" | "createdAt" | "updatedAt" | "completedAt"
>;

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  completedAt?: string;
};
export type CreateRoutineTaskInput = CreateTaskInput & Required<Pick<Task, "routineId" | "dueDate">>;
export type CreateRoutineTaskResult = { task: Task; created: boolean };

export interface TasksRepository {
  list(): Promise<Task[]>;
  getById(id: string): Promise<Task | undefined>;
  create(input: CreateTaskInput): Promise<Task>;
  createFromRoutine(input: CreateRoutineTaskInput): Promise<CreateRoutineTaskResult>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
}
