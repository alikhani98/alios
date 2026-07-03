import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { KnowledgeItem } from "@/shared/types";
import { Button, Input, Textarea } from "@/shared/ui";
import { KNOWLEDGE_TYPE_OPTIONS } from "../constants";
import {
  knowledgeItemFormSchema,
  type KnowledgeItemFormValues,
} from "../types";

type KnowledgeItemFormProps = {
  item?: KnowledgeItem;
  isSubmitting: boolean;
  onSubmit: (values: KnowledgeItemFormValues) => Promise<void>;
  onCancel: () => void;
};

export function KnowledgeItemForm({
  item,
  isSubmitting,
  onSubmit,
  onCancel,
}: KnowledgeItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KnowledgeItemFormValues>({
    resolver: zodResolver(knowledgeItemFormSchema),
    defaultValues: {
      title: item?.title ?? "",
      type: item?.type ?? "note",
      summary: item?.summary ?? "",
      content: item?.content ?? "",
      source: item?.source ?? "",
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-2">
          <label htmlFor="knowledge-title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="knowledge-title"
            autoFocus
            placeholder="A clear, searchable title"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="knowledge-type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="knowledge-type"
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("type")}
          >
            {KNOWLEDGE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="knowledge-summary" className="text-sm font-medium">
          Summary
        </label>
        <Input
          id="knowledge-summary"
          placeholder="One-line takeaway"
          {...register("summary")}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="knowledge-content" className="text-sm font-medium">
          Content
        </label>
        <Textarea
          id="knowledge-content"
          className="min-h-48"
          placeholder="Write the complete note, lesson, rule, or resource…"
          aria-invalid={Boolean(errors.content)}
          {...register("content")}
        />
        {errors.content ? (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="knowledge-source" className="text-sm font-medium">
          Source
        </label>
        <Input
          id="knowledge-source"
          placeholder="Book, URL, conversation, or origin"
          {...register("source")}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : item
              ? "Save changes"
              : "Create item"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
