import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import * as z from 'zod'
import { Upload, X, Loader2 } from '@/lib/icons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/types/marketplace'

const listingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().or(z.literal('')),
  price: z.number().nonnegative('Price must be a positive number'),
  negotiable: z.boolean(),
  category: z.enum(['BOOKS', 'ELECTRONICS', 'HOUSING', 'SERVICES', 'CLOTHING', 'OTHER'] as const),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'] as const),
  location: z.string().max(100, 'Location description is too long').optional().or(z.literal('')),
  tags: z.string().max(200, 'Tags list is too long').optional().or(z.literal('')),
})

export type ListingFormValues = z.infer<typeof listingSchema>

interface ListingFormProps {
  initialValues?: Partial<Listing>
  onSubmit: (values: ListingFormValues, files: File[]) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
  onDirtyStateChange?: (isDirty: boolean) => void
}

export function ListingForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Publish Listing',
  onDirtyStateChange,
}: ListingFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      price: initialValues?.price || 0,
      negotiable: initialValues?.negotiable || false,
      category: initialValues?.category || 'OTHER',
      condition: initialValues?.condition || 'GOOD',
      location: initialValues?.location || '',
      tags: initialValues?.tags || '',
    },
  })

  const negotiableValue = watch('negotiable')
  const conditionValue = watch('condition')

  useEffect(() => {
    onDirtyStateChange?.(isDirty || selectedFiles.length > 0)
  }, [isDirty, selectedFiles, onDirtyStateChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newFiles = Array.from(e.target.files)
    setSelectedFiles((prev) => [...prev, ...newFiles])

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    const previewUrl = previews[index]
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const onFormSubmit = async (data: ListingFormValues) => {
    await onSubmit(data, selectedFiles)
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Core details card container */}
      <div className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Listing Details</h3>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground">Listing Title *</label>
          <Input
            placeholder="e.g. MacBook Pro M2, organic chemistry notes..."
            {...register('title')}
            className={errors.title ? 'border-destructive' : ''}
          />
          {errors.title && <p className="text-[10px] text-destructive">{errors.title.message}</p>}
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Category *</label>
            <select
              {...register('category')}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground cursor-pointer"
            >
              <option value="BOOKS">📚 Books & Textbooks</option>
              <option value="ELECTRONICS">💻 Electronics & Devices</option>
              <option value="HOUSING">🏠 Student Housing</option>
              <option value="SERVICES">🛠️ Tutoring & Services</option>
              <option value="CLOTHING">👕 Clothing & Apparel</option>
              <option value="OTHER">✨ Other Items</option>
            </select>
            {errors.category && <p className="text-[10px] text-destructive">{errors.category.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Condition *</label>
            <div className="grid grid-cols-5 border border-border rounded-lg overflow-hidden h-9 text-xs">
              {(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'] as const).map((cond) => {
                const isActive = conditionValue === cond
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setValue('condition', cond)}
                    className={`flex items-center justify-center font-semibold transition-colors cursor-pointer border-r last:border-r-0 border-border ${
                      isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {cond === 'LIKE_NEW' ? 'L_NEW' : cond}
                  </button>
                )
              })}
            </div>
            {errors.condition && <p className="text-[10px] text-destructive">{errors.condition.message}</p>}
          </div>
        </div>
      </div>

      {/* Pricing & Location */}
      <div className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Pricing & Logistics</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Price ($) *</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('price', { valueAsNumber: true })}
              className={errors.price ? 'border-destructive' : ''}
            />
            {errors.price && <p className="text-[10px] text-destructive">{errors.price.message}</p>}
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Meetup Location</label>
            <Input
              placeholder="e.g. Hill Library lobby, Student Union..."
              {...register('location')}
            />
          </div>
        </div>

        {/* Negotiable Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-muted/20">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Price is Negotiable</p>
            <p className="text-[10px] text-muted-foreground">Select this if you are open to counter-offers</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('negotiable', !negotiableValue)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              negotiableValue ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                negotiableValue ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Description & Media */}
      <div className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Description & Photos</h3>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground">Item Description</label>
          <textarea
            placeholder="Provide condition details, features, specifications, and trade expectations..."
            {...register('description')}
            rows={4}
            className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-foreground">Tags (comma-separated)</label>
          <Input placeholder="e.g. textbook, cs, midterm, apple" {...register('tags')} />
        </div>

        {/* Media Upload zone */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-foreground">Listing Photos</label>
          <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/10 transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="size-6 text-muted-foreground mb-2" />
            <p className="text-xs font-bold text-foreground">Click to upload photos</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Supports PNG, JPG, JPEG up to 5MB</p>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {previews.map((src, index) => (
                <div key={src} className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black transition-colors cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3">
        <Link to="/marketplace">
          <Button variant="ghost" type="button" className="h-10 rounded-xl cursor-pointer">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 rounded-xl gap-2 cursor-pointer min-w-[140px]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          <span>{submitLabel}</span>
        </Button>
      </div>
    </form>
  )
}
