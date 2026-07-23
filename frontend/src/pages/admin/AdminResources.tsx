import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  useAdminResourcesQuery,
  useUpdateResourceStatusMutation,
  useDeleteResourceMutation,
} from '@/features/admin/hooks/useAdmin'
import {
  Loader2,
  Check,
  XCircle,
  Trash2,
  BookOpen,
  Download,
  AlertTriangle,
  Archive,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminResources() {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED'>('ALL')
  const { data: resources, isLoading } = useAdminResourcesQuery()

  const updateStatusMutation = useUpdateResourceStatusMutation()
  const deleteResourceMutation = useDeleteResourceMutation()

  const filteredResources = resources?.filter((item) => {
    if (filter === 'ALL') return true
    return item.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-500">PENDING</Badge>
      case 'ACTIVE':
        return <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5">APPROVED</Badge>
      case 'REJECTED':
        return <Badge variant="destructive" className="text-[9px] bg-destructive/10 text-destructive">REJECTED</Badge>
      default:
        return <Badge variant="outline" className="text-[9px] text-muted-foreground">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="size-5.5 text-primary" />
          Resource Moderation Queue
        </h1>
        <p className="text-xs text-muted-foreground">
          Review academic integrity of uploaded study sheets, files, and lectures.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card border border-border/60 w-fit">
        {(['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'ARCHIVED'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setFilter(status)}
            className="text-[10px] font-semibold h-7.5 px-3 rounded-lg"
          >
            {status === 'ACTIVE' ? 'APPROVED' : status}
          </Button>
        ))}
      </div>

      {/* Resources Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/60">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading active library index…</p>
            </div>
          ) : !filteredResources || filteredResources.length === 0 ? (
            <div className="text-center py-20 text-xs text-muted-foreground">
              No study resources found in this category.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Title & Material</th>
                  <th className="py-3 px-4 w-[110px]">Category</th>
                  <th className="py-3 px-4 w-[100px]">Priority</th>
                  <th className="py-3 px-4 w-[110px]">Attachments</th>
                  <th className="py-3 px-4 w-[100px]">Reports</th>
                  <th className="py-3 px-4 w-[100px]">Status</th>
                  <th className="py-3 px-4 text-right w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((item) => (
                  <motion.tr
                    key={item.id}
                    layout
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                  >
                    {/* Title and tags */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-foreground">{item.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[280px] truncate">
                          {item.description || 'No description provided.'}
                        </div>
                        {item.tags && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {item.tags.split(',').map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 border-border/80">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-medium text-muted-foreground">
                      {item.category?.replaceAll('_', ' ')}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-semibold ${
                          item.priority === 'HIGH'
                            ? 'border-destructive/30 text-destructive bg-destructive/5'
                            : 'border-border/80 text-muted-foreground'
                        }`}
                      >
                        {item.priority}
                      </Badge>
                    </td>

                    {/* Attachments link list */}
                    <td className="py-3.5 px-4">
                      {item.attachments && item.attachments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {item.attachments.map((file: any) => (
                            <a
                              key={file.id}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[9px] text-primary hover:underline font-medium"
                            >
                              <Download className="size-2.5 shrink-0" />
                              <span className="truncate max-w-[90px]">{file.fileName}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-[10px]">No files</span>
                      )}
                    </td>

                    {/* Reports placeholder (simulated) */}
                    <td className="py-3.5 px-4">
                      {item.priority === 'HIGH' && (!item.attachments || item.attachments.length === 0) ? (
                        <div className="flex items-center gap-1 text-amber-500 font-semibold text-[10px]">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>Empty Attachment</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 text-[10px]">0 reports</span>
                      )}
                    </td>

                    {/* Moderation Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Actions Panel */}
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {item.status !== 'ACTIVE' && (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="hover:bg-emerald-500/10 border-transparent text-emerald-400"
                          title="Approve Resource"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              resourceId: item.id,
                              status: 'ACTIVE',
                            })
                          }
                        >
                          <Check className="size-3.5" />
                        </Button>
                      )}

                      {item.status !== 'REJECTED' && (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="hover:bg-destructive/10 border-transparent text-destructive"
                          title="Reject / Flag Resource"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              resourceId: item.id,
                              status: 'REJECTED',
                            })
                          }
                        >
                          <XCircle className="size-3.5" />
                        </Button>
                      )}

                      {item.status !== 'ARCHIVED' && (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="hover:bg-primary/10 border-transparent text-primary"
                          title="Archive Resource"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              resourceId: item.id,
                              status: 'ARCHIVED',
                            })
                          }
                        >
                          <Archive className="size-3.5" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="hover:bg-destructive/10 border-transparent text-destructive"
                        title="Purge Permanently"
                        onClick={() => {
                          if (confirm(`Permanently delete resource "${item.title}"?`)) {
                            deleteResourceMutation.mutate(item.id)
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
