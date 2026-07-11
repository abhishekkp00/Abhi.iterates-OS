import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from '@/lib/icons'

// ── Validation Schema using Zod ──────────────────────────────────────────────
const resourceFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters.' })
    .max(100, { message: 'Title must not exceed 100 characters.' }),
  description: z
    .string()
    .max(1000, { message: 'Description must not exceed 1000 characters.' })
    .optional()
    .or(z.literal('')),
  category: z.enum(['LECTURE', 'BOOK', 'CHEATSHEET', 'PAST_PAPER', 'OTHER']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']),
  deadline: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Please enter a valid date.' }
    )
    .or(z.literal('')),
  tags: z
    .string()
    .optional()
    .or(z.literal('')),
})

export type ResourceFormValues = z.infer<typeof resourceFormSchema>

interface ResourceFormProps {
  initialData?: Partial<ResourceFormValues>
  onSubmit: (values: ResourceFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  onDirtyStateChange?: (isDirty: boolean) => void
}

export function ResourceForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Resource',
  onDirtyStateChange,
}: ResourceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      category: initialData?.category ?? 'LECTURE',
      priority: initialData?.priority ?? 'MEDIUM',
      status: initialData?.status ?? 'ACTIVE',
      deadline: initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '',
      tags: initialData?.tags ?? '',
    },
  })

  useEffect(() => {
    onDirtyStateChange?.(isDirty)
  }, [isDirty, onDirtyStateChange])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-card border border-border rounded-xl p-6 shadow-sm">
      {/* Title Input */}
      <div className="space-y-1">
        <label htmlFor="title" className="text-xs font-semibold text-foreground">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          placeholder="e.g. Calculus II Midterm Study Guide"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1 font-medium">{errors.title.message}</p>
        )}
      </div>

      {/* Description TextArea */}
      <div className="space-y-1">
        <label htmlFor="description" className="text-xs font-semibold text-foreground">
          Description
        </label>
        <textarea
          id="description"
          placeholder="Brief summary of what this resource covers..."
          rows={4}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...register('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-xs text-destructive mt-1 font-medium">{errors.description.message}</p>
        )}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Category Select */}
        <div className="space-y-1">
          <label htmlFor="category" className="text-xs font-semibold text-foreground">
            Category <span className="text-destructive">*</span>
          </label>
          <select
            id="category"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            {...register('category')}
          >
            <option value="LECTURE">Lecture Slides</option>
            <option value="BOOK">Textbook</option>
            <option value="CHEATSHEET">Cheat Sheet</option>
            <option value="PAST_PAPER">Past Paper</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.category && (
            <p className="text-xs text-destructive mt-1 font-medium">{errors.category.message}</p>
          )}
        </div>

        {/* Priority Select */}
        <div className="space-y-1">
          <label htmlFor="priority" className="text-xs font-semibold text-foreground">
            Priority <span className="text-destructive">*</span>
          </label>
          <select
            id="priority"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            {...register('priority')}
          >
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
          {errors.priority && (
            <p className="text-xs text-destructive mt-1 font-medium">{errors.priority.message}</p>
          )}
        </div>

        {/* Status Select */}
        <div className="space-y-1">
          <label htmlFor="status" className="text-xs font-semibold text-foreground">
            Status <span className="text-destructive">*</span>
          </label>
          <select
            id="status"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            {...register('status')}
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          {errors.status && (
            <p className="text-xs text-destructive mt-1 font-medium">{errors.status.message}</p>
          )}
        </div>

        {/* Target Deadline */}
        <div className="space-y-1">
          <label htmlFor="deadline" className="text-xs font-semibold text-foreground">
            Target Completion Deadline
          </label>
          <input
            id="deadline"
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            {...register('deadline')}
          />
          {errors.deadline && (
            <p className="text-xs text-destructive mt-1 font-medium">{errors.deadline.message}</p>
          )}
        </div>
      </div>

      {/* Tags input field */}
      <div className="space-y-1">
        <label htmlFor="tags" className="text-xs font-semibold text-foreground">
          Tags (comma separated)
        </label>
        <Input
          id="tags"
          placeholder="e.g. midterm, math, study-guide"
          {...register('tags')}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 border-t border-border pt-4">
        <Button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="gap-2"
        >
          {(isLoading || isSubmitting) && <Loader2 className="size-4 animate-spin" />}
          <span>{submitLabel}</span>
        </Button>
      </div>
    </form>
  )
}
