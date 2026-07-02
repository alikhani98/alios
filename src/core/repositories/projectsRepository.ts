import type { Project } from "@/shared/types";

export type CreateProjectInput = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "archivedAt"
>;

export type UpdateProjectInput = Partial<CreateProjectInput> & {
  archivedAt?: string;
};

export interface ProjectsRepository {
  list(): Promise<Project[]>;
  getById(id: string): Promise<Project | undefined>;
  create(input: CreateProjectInput): Promise<Project>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
  delete(id: string): Promise<void>;
  archive(id: string): Promise<Project>;
}
