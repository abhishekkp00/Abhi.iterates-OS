import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useBlocker } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, AlertCircle } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { ResourceForm, type ResourceFormValues } from '@/features/resources/components/ResourceForm'
import {
  useResourceDetailQuery,
  useUpdateResourceMutation,
} from '@/features/resources/hooks/useResources'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'

export default function ResourceEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Track if the form is dirty
  const [isDirty, setIsDirty] = useState(false)
  // Track if we are currently saving (to bypass blocker)
  const [isSaving, setIsSaving] = useState(false)

  // Query details
  const { data: resource, isLoading, isError, error } = useResourceDetailQuery(id)

  // Update mutation
  const updateMutation = useUpdateResourceMutation()

  // SPA navigation blocker via React Router v6
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSaving && currentLocation.pathname !== nextLocation.pathname
  )

  // Tab/browser close or reload prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSaving) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, isSaving])

  async function handleSubmit(values: ResourceFormValues) {
    if (!id) return
    try {
      setIsSaving(true)
      // Save updates to API
      await updateMutation.mutateAsync({
        id,
        resource: {
          title: values.title,
          description: values.description,
          category: values.category,
          priority: values.priority,
          status: values.status,
          deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
          tags: values.tags,
        },
      })
      
      // Navigate to details page
      navigate(`/resources/${id}`)
    } catch (err) {
      setIsSaving(false)
      // Toast notification is handled by the mutation itself
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="page-container max-w-3xl animate-pulse space-y-6">
        <div className="h-6 w-32 rounded bg-muted"></div>
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-muted"></div>
          <div className="h-4 w-96 rounded bg-muted"></div>
        </div>
        <div className="h-[400px] rounded-xl bg-card border border-border"></div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (isError || !resource) {
    return (
      <div className="page-container max-w-xl text-center py-16 space-y-4">
        <div className="inline-flex rounded-full bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Failed to Load Resource</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-normal">
          {error instanceof Error ? error.message : 'The resource details could not be retrieved from the API.'}
        </p>
        <Link to="/resources">
          <Button variant="outline" size="sm" className="mt-4 gap-1.5">
            <ArrowLeft className="size-4" />
            <span>Back to Resources List</span>
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container max-w-3xl">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Header toolbar */}
        <motion.div variants={staggerChildVariants} className="space-y-4">
          <Link to={`/resources/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-3">
              <ArrowLeft className="size-4" />
              <span>Back to Details</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Edit Resource
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modify resource metadata, adjust deadlines, or toggle urgency status.
            </p>
          </div>
        </motion.div>

        {/* Form Container */}
        <motion.div variants={staggerChildVariants}>
          <ResourceForm
            initialData={resource}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            submitLabel="Save Changes"
            onDirtyStateChange={setIsDirty}
          />
        </motion.div>
      </motion.div>

      {/* Unsaved Changes Blocker Modal overlay */}
      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 m-4"
            >
              <div className="flex gap-3">
                <div className="rounded-full bg-destructive/10 p-2 text-destructive h-fit">
                  <AlertCircle className="size-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">Discard Unsaved Changes?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You have unsaved edits in your resource form. Navigating away will discard these changes permanently.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 border-t border-border pt-4 text-xs font-semibold">
                <Button variant="outline" size="sm" onClick={() => blocker.reset()}>
                  Keep Editing
                </Button>
                <Button variant="destructive" size="sm" onClick={() => blocker.proceed()}>
                  Discard
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
