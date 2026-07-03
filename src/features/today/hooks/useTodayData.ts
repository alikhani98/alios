import { useCallback, useEffect, useState } from "react";

import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { DailyCheckin, Task, TaskStatus } from "@/shared/types";
import type { DailyCheckinFormValues } from "../types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useTodayData(today: string) {
  const { tasks: tasksRepository, dailyCheckins } = useStorageAdapter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkin, setCheckin] = useState<DailyCheckin | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadToday = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [allTasks, todayCheckin] = await Promise.all([
        tasksRepository.list(),
        dailyCheckins.getByDate(today),
      ]);
      setTasks(allTasks.filter((task) => task.dueDate === today));
      setCheckin(todayCheckin);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [dailyCheckins, tasksRepository, today]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const clearOtherMit = useCallback(
    async (exceptId?: string) => {
      const otherMitTasks = tasks.filter(
        (task) => task.isMit && task.id !== exceptId
      );
      await Promise.all(
        otherMitTasks.map((task) =>
          tasksRepository.update(task.id, { isMit: false })
        )
      );
    },
    [tasks, tasksRepository]
  );

  const createTask = useCallback(
    async (input: Omit<CreateTaskInput, "dueDate">) => {
      setError(null);
      if (input.isMit) {
        await clearOtherMit();
      }
      const task = await tasksRepository.create({ ...input, dueDate: today });
      setTasks((current) => [
        ...current.map((item) =>
          input.isMit ? { ...item, isMit: false } : item
        ),
        task,
      ]);
      if (input.isMit && checkin) {
        const updatedCheckin = await dailyCheckins.update(checkin.id, {
          mitTaskId: task.id,
        });
        setCheckin(updatedCheckin);
      }
      return task;
    },
    [checkin, clearOtherMit, dailyCheckins, tasksRepository, today]
  );

  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput) => {
      setError(null);
      if (input.isMit) {
        await clearOtherMit(id);
      }
      const task = await tasksRepository.update(id, input);
      setTasks((current) =>
        current.map((item) => {
          if (item.id === id) return task;
          return input.isMit ? { ...item, isMit: false } : item;
        })
      );
      if (input.isMit && checkin) {
        const updatedCheckin = await dailyCheckins.update(checkin.id, {
          mitTaskId: id,
        });
        setCheckin(updatedCheckin);
      } else if (input.isMit === false && checkin?.mitTaskId === id) {
        const updatedCheckin = await dailyCheckins.update(checkin.id, {
          mitTaskId: undefined,
        });
        setCheckin(updatedCheckin);
      }
      return task;
    },
    [checkin, clearOtherMit, dailyCheckins, tasksRepository]
  );

  const updateTaskStatus = useCallback(
    (id: string, status: TaskStatus) =>
      updateTask(id, {
        status,
        completedAt: status === "done" ? new Date().toISOString() : undefined,
      }),
    [updateTask]
  );

  const selectMit = useCallback(
    async (id: string) => updateTask(id, { isMit: true }),
    [updateTask]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setError(null);
      await tasksRepository.delete(id);
      setTasks((current) => current.filter((task) => task.id !== id));
      if (checkin?.mitTaskId === id) {
        const updatedCheckin = await dailyCheckins.update(checkin.id, {
          mitTaskId: undefined,
        });
        setCheckin(updatedCheckin);
      }
    },
    [checkin, dailyCheckins, tasksRepository]
  );

  const saveCheckin = useCallback(
    async (values: DailyCheckinFormValues) => {
      setError(null);
      const notes = values.notes || undefined;
      const mitTaskId = tasks.find((task) => task.isMit)?.id;
      const saved = checkin
        ? await dailyCheckins.update(checkin.id, { ...values, notes, mitTaskId })
        : await dailyCheckins.create({
            ...values,
            notes,
            date: today,
            mitTaskId,
          });
      setCheckin(saved);
      return saved;
    },
    [checkin, dailyCheckins, tasks, today]
  );

  return {
    tasks,
    checkin,
    isLoading,
    error,
    loadToday,
    createTask,
    updateTask,
    updateTaskStatus,
    selectMit,
    deleteTask,
    saveCheckin,
  };
}
