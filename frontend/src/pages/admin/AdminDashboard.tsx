import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAdminSummaryQuery } from '@/features/admin/hooks/useAdmin'
import {
  Users,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Database,
  Radio,
  Cpu,
  Activity,
  ChevronRight,
  Settings,
  ShieldCheck,
  RefreshCw,
  Loader2,
} from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
  const { data: summary, isLoading, isError, refetch, isFetching } = useAdminSummaryQuery()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP':
        return 'bg-emerald-500'
      case 'DEGRADED':
        return 'bg-amber-500'
      default:
        return 'bg-destructive'
    }
  }

  const getServiceIcon = (name: string) => {
    if (name.includes('Database')) return <Database className="size-4 text-primary" />
    if (name.includes('WebSocket')) return <Radio className="size-4 text-purple-400" />
    if (name.includes('AI')) return <Sparkles className="size-4 text-cyan-400" />
    return <Cpu className="size-4 text-amber-400" />
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Gathering platform intelligence…</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-destructive">Failed to Load Control Panel</h2>
          <p className="text-sm text-muted-foreground">Ensure your session has administrative privileges.</p>
        </div>
        <Button onClick={() => refetch()} size="sm">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-6 max-w-7xl space-y-8"
    >
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Platform Administration</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor infrastructure health, manage security groups, and review community operations.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9 gap-2 text-xs"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing' : 'Sync Logs'}
        </Button>
      </div>

      {/* Aggregate Overview Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="bg-card hover:bg-muted/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Student Body
            </CardTitle>
            <Users className="size-4.5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalUsers ?? 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Active registrations database-wide</p>
          </CardContent>
        </Card>

        {/* Total Resources */}
        <Card className="bg-card hover:bg-muted/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Academic Resources
            </CardTitle>
            <BookOpen className="size-4.5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalResources ?? 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Study materials shared by creators</p>
          </CardContent>
        </Card>

        {/* Total listings */}
        <Card className="bg-card hover:bg-muted/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Marketplace Listings
            </CardTitle>
            <ShoppingBag className="size-4.5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalListings ?? 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Active student buy/sell offers</p>
          </CardContent>
        </Card>

        {/* AI Conversations */}
        <Card className="bg-card hover:bg-muted/10 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              AI Conversations
            </CardTitle>
            <Sparkles className="size-4.5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalConversations ?? 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">LLM queries & chat contexts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Infrastructure & Audit */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* System & Health Check list */}
        <Card className="col-span-4 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Cpu className="size-4 text-primary" />
              Service Infrastructure Status
            </CardTitle>
            <CardDescription className="text-xs">
              Live checks of databases, messaging brokers, and key APIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary?.systemStatus.map((service, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-card hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/60">
                    {getServiceIcon(service.serviceName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{service.serviceName}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{service.message}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-border/80">
                    {service.latency}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${getStatusColor(service.status)} animate-pulse`} />
                    <span className="text-[10px] font-semibold text-muted-foreground">{service.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Audit Log timeline summary */}
        <Card className="col-span-3 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-purple-400" />
              Recent Operations Log
            </CardTitle>
            <CardDescription className="text-xs">
              Audit trails of administrative and security events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative border-l border-border/80 pl-4 space-y-5">
              {summary?.recentActivities.map((act, idx) => (
                <div key={idx} className="relative text-xs">
                  {/* Indicator Dot */}
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full border border-primary bg-background" />
                  <p className="leading-normal text-muted-foreground">{act}</p>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <Link to="/admin/audit">
                <Button variant="outline" className="w-full text-xs h-9 font-semibold gap-1">
                  View Full Audit Logs
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Quick Portals
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Link to="/admin/users" className="block group">
            <Card className="h-full border border-border/60 hover:border-primary/30 bg-card hover:bg-muted/10 transition-all duration-300">
              <CardHeader className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <Users className="size-5 text-primary group-hover:scale-105 transition-transform" />
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <CardTitle className="text-xs font-bold pt-2">User Registry</CardTitle>
                <CardDescription className="text-[10px] leading-relaxed">
                  Manage student profiles, accounts, permissions, and roles.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/resources" className="block group">
            <Card className="h-full border border-border/60 hover:border-purple-500/30 bg-card hover:bg-muted/10 transition-all duration-300">
              <CardHeader className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <BookOpen className="size-5 text-purple-400 group-hover:scale-105 transition-transform" />
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <CardTitle className="text-xs font-bold pt-2">Resources Mod</CardTitle>
                <CardDescription className="text-[10px] leading-relaxed">
                  Approve, delete, or inspect reported study resources.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/marketplace" className="block group">
            <Card className="h-full border border-border/60 hover:border-emerald-500/30 bg-card hover:bg-muted/10 transition-all duration-300">
              <CardHeader className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <ShoppingBag className="size-5 text-emerald-400 group-hover:scale-105 transition-transform" />
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <CardTitle className="text-xs font-bold pt-2">Marketplace Mod</CardTitle>
                <CardDescription className="text-[10px] leading-relaxed">
                  Approve or reject active campus marketplace listings.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/settings" className="block group">
            <Card className="h-full border border-border/60 hover:border-amber-500/30 bg-card hover:bg-muted/10 transition-all duration-300">
              <CardHeader className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <Settings className="size-5 text-amber-400 group-hover:scale-105 transition-transform" />
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <CardTitle className="text-xs font-bold pt-2">System Config</CardTitle>
                <CardDescription className="text-[10px] leading-relaxed">
                  Modify system settings, registration options, and flags.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
