import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Trash2, CheckCircle2, MessageSquare, Sparkles, Clock } from '@/lib/icons'
import { Button } from '@/components/ui/button'

type MockNotification = {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notifications, setNotifications] = useState<MockNotification[]>([
    {
      id: '1',
      type: 'RESOURCE_COMMENTED',
      message: 'Alex Rivera commented on your resource "Advanced Algorithms Study Guide"',
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: '/resources/1'
    },
    {
      id: '2',
      type: 'MENTION',
      message: 'Sarah Chen mentioned you in a comment on "Database Schema Design"',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      actionUrl: '/resources/2'
    },
    {
      id: '3',
      type: 'TASK_DUE_SOON',
      message: 'Task "Submit Operating Systems Lab" is due in 3 hours',
      read: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      actionUrl: '/tasks'
    },
    {
      id: '4',
      type: 'SYSTEM_ANNOUNCEMENT',
      message: 'Welcome to AbhiIterates.OS! Explore the real-time collaboration dashboard.',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ])

  const filtered = notifications.filter(n => filter === 'all' || !n.read)

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'RESOURCE_COMMENTED':
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
            Stay updated with real-time comments, mentions, and system alerts.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={markAllRead} className="h-9">
              <CheckCircle2 className="size-3.5 mr-2" />
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 text-destructive hover:bg-destructive/10">
              <Trash2 className="size-3.5 mr-2" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border/40">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'unread'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread ({notifications.filter(n => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/60 rounded-xl bg-card/20">
            <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground mb-4">
              <Bell className="size-6" />
            </div>
            <h3 className="font-semibold text-lg">No notifications</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              You are all caught up! When you get new notifications, they will show up here.
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
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${!n.read ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {n.message}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/75">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={n.read ? 'Mark as unread' : 'Mark as read'}
                  onClick={() => toggleRead(n.id)}
                >
                  <CheckCircle2 className={`size-4 ${n.read ? 'text-muted-foreground' : 'text-primary'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:bg-destructive/10"
                  title="Delete notification"
                  onClick={() => deleteNotification(n.id)}
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
