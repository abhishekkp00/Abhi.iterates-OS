import { useState } from 'react'
import {
  useAdminAuditLogsQuery,
} from '@/features/admin/hooks/useAdmin'
import {
  Loader2,
  Shield,
  Search,
  Download,
  Clock,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function AdminAudit() {
  const [search, setSearch] = useState('')
  const { data: logs, isLoading } = useAdminAuditLogsQuery(search)

  // Export audit logs as CSV
  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return

    const headers = ['Timestamp', 'Admin Email', 'Action', 'Target', 'Details', 'IP Address']
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.adminEmail,
      log.action,
      log.target,
      log.details || '',
      log.ipAddress || '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `abhi_iterates_audit_log_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('ROLES')) return <Key className="size-4 text-amber-400" />
    if (action.includes('DELETE') || action.includes('PURGE')) return <Trash2 className="size-4 text-destructive" />
    if (action.includes('DEACTIVATE')) return <XCircle className="size-4 text-red-500" />
    if (action.includes('REACTIVATE') || action.includes('ACTIVE')) return <CheckCircle2 className="size-4 text-emerald-400" />
    return <Shield className="size-4 text-primary" />
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('ROLES')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    if (action.includes('DELETE') || action.includes('PURGE')) return 'bg-destructive/10 text-destructive border-destructive/20'
    if (action.includes('DEACTIVATE')) return 'bg-red-500/10 text-red-400 border-red-500/20'
    if (action.includes('ACTIVE')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    return 'bg-primary/10 text-primary border-primary/20'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="size-5.5 text-primary" />
            Security & Operations Audit Trail
          </h1>
          <p className="text-xs text-muted-foreground">
            Verifiable history of administrative events, security assignments, and moderation actions.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={!logs || logs.length === 0}
          variant="outline"
          size="sm"
          className="text-xs font-semibold h-9 shrink-0 gap-1.5"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, action type, or modified target…"
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Timeline Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/60">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Verifying audit database indices…</p>
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-20 text-xs text-muted-foreground">
              No audit logs found. Perform actions inside User registry or Moderation queues to seed events!
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-[180px]">Timestamp</th>
                  <th className="py-3 px-4 w-[180px]">Administrator</th>
                  <th className="py-3 px-4 w-[180px]">Action Type</th>
                  <th className="py-3 px-4 w-[150px]">Modified Target</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4 w-[120px] text-right">Client IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-muted-foreground text-[10px] font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground/60" />
                        <span>
                          {new Date(log.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Administrator email */}
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {log.adminEmail}
                    </td>

                    {/* Action type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {getActionIcon(log.action)}
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-mono border ${getActionBadgeColor(log.action)}`}
                        >
                          {log.action}
                        </Badge>
                      </div>
                    </td>

                    {/* Affected target */}
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {log.target}
                    </td>

                    {/* Custom details */}
                    <td className="py-3.5 px-4 text-muted-foreground leading-normal max-w-[250px] truncate">
                      {log.details || '—'}
                    </td>

                    {/* Client IP Address */}
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground text-[10px]">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
