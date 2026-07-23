import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@/services/api'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FolderOpen,
  Download,
  Calendar,
  AlertCircle,
  FileText,
  File,
  Bookmark,
  MessageSquare,
  Eye,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import {
  useResourceDetailQuery,
  useDeleteResourceMutation,
  useArchiveResourceMutation,
} from '@/features/resources/hooks/useResources'
import { ResourceActivityTimeline } from '@/features/resources/components/ResourceActivityTimeline'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  LECTURE: 'Lecture Slides',
  BOOK: 'Textbook / PDF Book',
  CHEATSHEET: 'Quick Study Cheat Sheet',
  PAST_PAPER: 'Midterm/Final Past Paper',
  OTHER: 'Other / Custom Reference',
}

const PRIORITY_BADGES: Record<string, string> = {
  HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
  MEDIUM: 'bg-warning/10 text-warning border-warning/20',
  LOW: 'bg-info/10 text-info border-info/20',
}

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-success/15 text-success border-success/30',
  DRAFT: 'bg-muted text-muted-foreground border-border',
  ARCHIVED: 'bg-warning/10 text-warning border-warning/20',
}

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()


  // Query detail hook
  const { data: resource, isLoading, isError, error } = useResourceDetailQuery(id)

  // Mutation hooks
  const deleteMutation = useDeleteResourceMutation()
  const archiveMutation = useArchiveResourceMutation()

  async function handleDelete() {
    if (!id) return
    if (confirm('Are you sure you want to delete this study resource? This operation is permanent.')) {
      await deleteMutation.mutateAsync(id)
      navigate('/resources')
    }
  }

  async function handleArchive() {
    if (!id) return
    await archiveMutation.mutateAsync(id)
  }

  async function handleDownload(downloadUrl: string, fileName: string) {
    try {
      const cleanUrl = downloadUrl.startsWith('/api/v1') ? downloadUrl.replace('/api/v1', '') : downloadUrl
      const response = await api.get(cleanUrl, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: (response.headers['content-type'] || 'application/octet-stream') as string })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch (_err) {
      toast.error('Failed to download file. Please try again.')
    }
  }

  const handlePreviewFile = (downloadUrl: string, fileName: string) => {
    navigate(`/resources/study/${id}?file=${encodeURIComponent(fileName)}&url=${encodeURIComponent(downloadUrl)}`)
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="page-container max-w-5xl animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-muted"></div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <div className="h-40 rounded-xl bg-card border border-border"></div>
            <div className="h-32 rounded-xl bg-card border border-border"></div>
          </div>
          <div className="space-y-5">
            <div className="h-44 rounded-xl bg-card border border-border"></div>
            <div className="h-44 rounded-xl bg-card border border-border"></div>
          </div>
        </div>
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

  const hasDeadline = !!resource.deadline
  const isOverdue = hasDeadline && new Date(resource.deadline!) < new Date() && resource.status !== 'ARCHIVED'

  return (
    <div className="page-container max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Header toolbar */}
        <motion.div
          variants={staggerChildVariants}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5"
        >
          <div className="space-y-2">
            <Link to="/library">
              <Button variant="ghost" size="sm" className="gap-1.5 -ml-3 cursor-pointer">
                <ArrowLeft className="size-4" />
                <span>Back to Library</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground line-clamp-1">
              {resource.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {resource.status !== 'ARCHIVED' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
              >
                <Bookmark className="size-4" />
                <span>Archive</span>
              </Button>
            )}
            <Link to={`/resources/${resource.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                <Pencil className="size-4" />
                <span>Edit Details</span>
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 cursor-pointer"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-4" />
              <span>Delete</span>
            </Button>
          </div>
        </motion.div>

        {/* Two column grid layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content Details (Left Column) */}
          <motion.div variants={staggerChildVariants} className="lg:col-span-2 space-y-6">
            {/* PDF Viewer Embed if previewUrl is active */}


            {/* Description Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 text-muted-foreground border-b border-border pb-3">
                <FileText className="size-4" />
                <h3 className="text-sm font-semibold text-foreground">Summary & Notes</h3>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {resource.description || 'No description or summary provided.'}
              </p>
            </div>

            {/* Attachments Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 text-muted-foreground border-b border-border pb-3">
                <FolderOpen className="size-4" />
                <h3 className="text-sm font-semibold text-foreground">File Attachments</h3>
              </div>
              {resource.attachments && resource.attachments.length > 0 ? (
                <div className="divide-y divide-border">
                  {resource.attachments.map((att) => {
                    const isPdf = att.fileName.toLowerCase().endsWith('.pdf') || att.contentType === 'application/pdf'
                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded bg-muted p-2 text-muted-foreground shrink-0">
                            <File className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {att.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {(att.fileSize / 1024).toFixed(1)} KB • {att.contentType ?? 'Unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isPdf && (
                            <button
                              onClick={() => handlePreviewFile(att.downloadUrl, att.fileName)}
                              className="rounded border border-input bg-background p-2 text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                              title="Preview Document"
                            >
                              <Eye className="size-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(att.downloadUrl, att.fileName)}
                            className="rounded border border-input bg-background p-2 text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                            title="Download Attachment"
                          >
                            <Download className="size-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No documents or files attached.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Upload textbooks, slides, or syllabus files to keep them organized.
                  </p>
                </div>
              )}
            </div>

            {/* Study Comment Box Placeholder */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 text-muted-foreground border-b border-border pb-3">
                <MessageSquare className="size-4" />
                <h3 className="text-sm font-semibold text-foreground">Study Notes Feed</h3>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 border border-dashed border-border text-center space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Post dynamic personal comments, questions, or formulas to track your study sessions.
                </p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    disabled
                    placeholder="Add personal study notes... (Coming Soon)"
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 text-xs shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                  <Button size="xs" disabled className="text-[10px]">Comment</Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar Metadata (Right Column) */}
          <motion.div variants={staggerChildVariants} className="space-y-6">
            {/* Metadata Overview Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border pb-3">
                Resource Details
              </h3>
              <div className="space-y-3.5 text-xs">
                {/* Category info */}
                <div className="flex justify-between items-center py-1 border-b border-muted/30">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">
                    {CATEGORY_LABELS[resource.category] ?? resource.category}
                  </span>
                </div>

                {/* Priority status */}
                <div className="flex justify-between items-center py-1 border-b border-muted/30">
                  <span className="text-muted-foreground">Priority</span>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      PRIORITY_BADGES[resource.priority]
                    )}
                  >
                    {resource.priority}
                  </span>
                </div>

                {/* Study status */}
                <div className="flex justify-between items-center py-1 border-b border-muted/30">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      STATUS_BADGES[resource.status]
                    )}
                  >
                    {resource.status}
                  </span>
                </div>

                {/* Target Deadline date */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Target Deadline</span>
                  {hasDeadline ? (
                    <span
                      className={cn(
                        'flex items-center gap-1 font-semibold',
                        isOverdue ? 'text-destructive' : 'text-foreground'
                      )}
                    >
                      <Calendar className="size-3.5" />
                      <span>
                        {new Date(resource.deadline!).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground/60">No deadline</span>
                  )}
                </div>

                {/* Tags array list */}
                {resource.tags && (
                  <div className="pt-2">
                    <span className="block text-muted-foreground mb-1.5">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {resource.tags.split(',').map((tag) => (
                        <span
                          key={tag.trim()}
                          className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground border border-border"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Logs timeline */}
            <ResourceActivityTimeline resource={resource} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
