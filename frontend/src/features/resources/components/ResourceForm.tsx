import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUploadAttachmentMutation, useDeleteAttachmentMutation } from '@/features/resources/hooks/useResources'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Paperclip, Upload, X } from '@/lib/icons'

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

import type { Resource } from '@/types/resources'

export type ResourceFormValues = z.infer<typeof resourceFormSchema>

interface ResourceFormProps {
  initialData?: Partial<Resource>
  onSubmit: (values: ResourceFormValues) => Promise<string | undefined>
  isLoading?: boolean
  submitLabel?: string
  onDirtyStateChange?: (isDirty: boolean) => void
  onSuccess?: (id: string) => void
}

export function ResourceForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Resource',
  onDirtyStateChange,
  onSuccess,
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgresses, setUploadProgresses] = useState<{ fileName: string; percentage: number }[]>([])

  const uploadAttachmentMutation = useUploadAttachmentMutation()
  const deleteAttachmentMutation = useDeleteAttachmentMutation()

  useEffect(() => {
    onDirtyStateChange?.(isDirty || selectedFiles.length > 0)
  }, [isDirty, selectedFiles, onDirtyStateChange])

  const handleDeleteExistingAttachment = async (attachmentId: string) => {
    if (window.confirm('Are you sure you want to remove this attachment?')) {
      await deleteAttachmentMutation.mutateAsync({
        attachmentId,
        resourceId: initialData?.id || '',
      })
    }
  }

  const handleFormSubmit = async (values: ResourceFormValues) => {
    try {
      const resourceId = await onSubmit(values)
      if (!resourceId) return

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // Add to progresses state
          setUploadProgresses(prev => [...prev, { fileName: file.name, percentage: 0 }])

          await uploadAttachmentMutation.mutateAsync({
            resourceId,
            file,
            onUploadProgress: (progressEvent) => {
              const percentage = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
              setUploadProgresses(prev =>
                prev.map(p => p.fileName === file.name ? { ...p, percentage } : p)
              )
            }
          })
        }
      }

      onSuccess?.(resourceId)
    } catch (err) {
      console.error('Submission failed:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 bg-card border border-border rounded-xl p-6 shadow-sm">
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

      {/* File Attachments section */}
      <div className="space-y-3 border-t border-border pt-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="size-3.5" />
          <span>Attachments</span>
        </label>

        {/* Existing attachments */}
        {initialData?.attachments && initialData.attachments.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Existing Files</span>
            <div className="grid grid-cols-1 gap-2">
              {initialData.attachments.map((att) => (
                <div key={att.id} className="flex items-center justify-between text-xs bg-muted/30 p-2.5 rounded-lg border border-border">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate font-medium">{att.fileName}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">({(att.fileSize / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingAttachment(att.id)}
                    className="text-destructive hover:underline font-medium text-[11px] shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected files waiting to upload */}
        {selectedFiles.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">New Files to Upload</span>
            <div className="grid grid-cols-1 gap-2">
              {selectedFiles.map((file, idx) => {
                const progress = uploadProgresses.find(p => p.fileName === file.name)
                return (
                  <div key={idx} className="space-y-2 bg-muted/50 p-2.5 rounded-lg border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="size-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      {!progress && (
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                    {progress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Uploading...</span>
                          <span>{progress.percentage}%</span>
                        </div>
                        <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-150"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          onClick={() => document.getElementById('attachments-input')?.click()}
          className="flex flex-col items-center justify-center border border-dashed border-border hover:border-primary/50 rounded-xl p-5 bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer space-y-1.5 text-center"
        >
          <input
            id="attachments-input"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)])
              }
            }}
          />
          <Upload className="size-5 text-muted-foreground" />
          <div>
            <p className="text-xs font-semibold text-foreground">Click to upload files</p>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">Supports PDF, slides, and files up to 50MB</p>
          </div>
        </div>
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
