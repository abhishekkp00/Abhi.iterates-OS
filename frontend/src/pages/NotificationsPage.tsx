import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Trash2, CheckCircle2, MessageSquare, Sparkles, Clock, Loader2 } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { useNotificationStore } from '@/store/notification.store'

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const {
    notifications,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    remove,
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const filtered = notifications.filter((n) => filter === 'all' || !n.read)

  const getIcon = (type: string) => {
    switch (type) {
      case 'RESOURCE_COMMENTED':
      case 'RESOURCE_SHARED':
        return <MessageSquare className="size-4 text-emerald-400" />
      case 'MENTION':
        return <Sparkles className="size-4 text-purple-400" />
      case 'TASK_DUE_SOON':
        return <Clock className="size-4 text-amber-400" />
      default:
        return <Bell className="size-4 text-blue-400" />
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="size-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with real-time comments, mentions, task deadlines, and system alerts.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => markAllRead()} className="h-9">
              <CheckCircle2 className="size-3.5 mr-2" />
              Mark all read
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border/40">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            filter === 'all'
              ? 'border-primary text-foreground font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'border-primary text-foreground font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Fetching notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-xl bg-card/20">
            <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground mb-4">
              <Bell className="size-6" />
            </div>
            <h3 className="font-semibold text-base text-foreground">No notifications</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              You are all caught up! When new system notifications or activity occur, they will show up here.
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`group flex items-start gap-4 p-4 rounded-xl border transition-all ${
                !n.read
                  ? 'bg-primary/5 border-primary/20 hover:border-primary/30'
                  : 'bg-card/40 border-border/60 hover:bg-card/60'
              }`}
            >
              {/* Type Icon */}
              <div className={`p-2 rounded-lg shrink-0 ${!n.read ? 'bg-primary/10' : 'bg-muted/60'}`}>
                {getIcon(n.type)}
              </div>

              {/* Message & Time */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className={`text-sm leading-relaxed ${!n.read ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                  {n.message}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground/75">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {n.actionUrl && (
                    <a
                      href={n.actionUrl}
                      className="text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      View Details
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Mark as read"
                    onClick={() => markRead(n.id)}
                  >
                    <CheckCircle2 className="size-4 text-primary" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10"
                  title="Delete notification"
                  onClick={() => remove(n.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
