import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, CheckCircle2, Trash2, MessageSquare, Sparkles, Clock, ChevronRight } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { useNotificationStore } from '@/store/notification.store'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotificationStore()

  const getIcon = (type: string) => {
    switch (type) {
      case 'RESOURCE_SHARED':
        return <Sparkles className="size-4 text-purple-400" />
      case 'RESOURCE_COMMENTED':
      case 'MENTION':
        return <MessageSquare className="size-4 text-emerald-400" />
      case 'TASK_DUE_SOON':
        return <Clock className="size-4 text-amber-400" />
      default:
        return <Bell className="size-4 text-blue-400" />
    }
  }

  const getCategoryColorClass = (type: string) => {
    switch (type) {
      case 'RESOURCE_SHARED':
        return 'bg-purple-400/10 text-purple-400 border-purple-400/20'
      case 'RESOURCE_COMMENTED':
      case 'MENTION':
        return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
      case 'TASK_DUE_SOON':
        return 'bg-amber-400/10 text-amber-400 border-amber-400/20'
      default:
        return 'bg-blue-400/10 text-blue-400 border-blue-400/20'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border/80 shadow-2xl z-50 flex flex-col focus:outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Notification Center"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Mark all as read"
                    onClick={() => markAllRead()}
                  >
                    <CheckCircle2 className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close drawer">
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/60">
                    <Bell className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">All caught up!</h3>
                    <p className="text-xs text-muted-foreground max-w-[240px] mt-1">
                      No notifications at the moment. We will notify you when things happen.
                    </p>
                  </div>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <motion.div
                    layout
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      'group relative flex items-start gap-3.5 p-3.5 rounded-xl border transition-all',
                      !n.read
                        ? 'bg-primary/5 border-primary/20 hover:border-primary/30'
                        : 'bg-card border-border/50 hover:bg-muted/40'
                    )}
                  >
                    {/* Category Icon */}
                    <div className={cn('p-2 rounded-lg border shrink-0', getCategoryColorClass(n.type))}>
                      {getIcon(n.type)}
                    </div>

                    {/* Message Body */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={cn(
                        'text-xs leading-relaxed',
                        !n.read ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      )}>
                        {n.message}
                      </p>
                      
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80">
                        <Clock className="size-3" />
                        <span>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {n.actionUrl && (
                          <Link
                            to={n.actionUrl}
                            onClick={onClose}
                            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5 ml-1"
                          >
                            <span>Go</span>
                            <ChevronRight className="size-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Mark read"
                          onClick={() => markRead(n.id)}
                        >
                          <CheckCircle2 className="size-3.5 text-primary" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete"
                        onClick={() => remove(n.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border/60 bg-muted/20">
                <Link to="/notifications" onClick={onClose}>
                  <Button variant="outline" className="w-full text-xs font-semibold h-9">
                    View all notifications
                    <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
