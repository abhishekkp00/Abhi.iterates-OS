import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/store/theme.store'
import { APP_NAME, APP_TAGLINE, NAV_GROUPS } from '@/constants/app'
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  FolderOpen,
  Calendar,
  Sun,
  Moon,
  LayoutDashboard,
  BarChart3,
  List,
  Clock,
  CheckCircle2,
} from '@/lib/icons'

// ── Motion Variants ──────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function LandingPage() {
  const { setTheme, resolvedTheme } = useThemeStore()

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* ── Subtle Background Glow ────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-primary/15 via-indigo-500/10 to-transparent blur-3xl opacity-70" />
      </div>

      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/50 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              {APP_NAME}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl size-9 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Link to="/login">
              <Button variant="ghost" className="text-sm font-medium rounded-xl">
                Sign In
              </Button>
            </Link>

            <Link to="/register">
              <Button className="text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="pt-16 pb-12 md:pt-24 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center space-y-6"
          >
            <motion.div variants={itemVariants}>
              <Badge variant="secondary" className="px-3.5 py-1 rounded-full text-xs font-medium border border-border bg-muted/60 text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                <span>AI-Powered Academic Workspace</span>
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl"
            >
              {APP_TAGLINE}
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
            >
              A clean, unified platform for notes, PDFs, AI study assistance, course resources, and productivity tools.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-11 px-7 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all">
                  Get Started Free <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-6 text-sm font-medium rounded-xl border-border">
                  Sign In to Account
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Sleek Workspace Preview Frame ────────────────────────────────── */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-xl overflow-hidden">
            {/* Window Bar */}
            <div className="bg-muted/40 border-b border-border/60 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="size-3 rounded-full bg-border" />
                <div className="size-3 rounded-full bg-border" />
                <div className="size-3 rounded-full bg-border" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{APP_NAME} — Student Workspace</span>
              <div className="w-10" />
            </div>

            {/* Simple Workspace Representation */}
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[300px]">
              {/* Sidebar Preview */}
              <div className="p-4 border-b md:border-b-0 md:border-r border-border/50 bg-muted/20 space-y-4">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                  Navigation
                </div>
                <div className="space-y-1">
                  {NAV_GROUPS.flatMap((g) => g.items).slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                        item.id === 'dashboard'
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.id === 'dashboard' && <LayoutDashboard className="size-3.5" />}
                      {item.id === 'analytics' && <BarChart3 className="size-3.5" />}
                      {item.id === 'planner' && <Clock className="size-3.5" />}
                      {item.id === 'tasks' && <List className="size-3.5" />}
                      {item.id === 'calendar' && <Calendar className="size-3.5" />}
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Preview */}
              <div className="md:col-span-3 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Welcome to your Academic Workspace</h3>
                      <p className="text-xs text-muted-foreground">All your study tools, notes, and AI assistance in one place.</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                      System Ready
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-1">
                      <BookOpen className="size-4 text-primary" />
                      <div className="text-xs font-bold text-foreground">Library</div>
                      <div className="text-[11px] text-muted-foreground">Organized PDFs & notes</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-1">
                      <Sparkles className="size-4 text-indigo-500" />
                      <div className="text-xs font-bold text-foreground">AI Workspace</div>
                      <div className="text-[11px] text-muted-foreground">Smart document Q&A</div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-1">
                      <FolderOpen className="size-4 text-amber-500" />
                      <div className="text-xs font-bold text-foreground">Resources</div>
                      <div className="text-[11px] text-muted-foreground">Course materials & notes</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Secure JWT Authenticated</span>
                  <span>v1.0.0</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Cards ────────────────────────────────────────────────── */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                title: 'Library & Documents',
                desc: 'Upload and read course PDFs with integrated reader support.',
                icon: BookOpen,
              },
              {
                title: 'AI Study Assistant',
                desc: 'Get instant explanations and summaries powered by AI.',
                icon: Sparkles,
              },
              {
                title: 'Resource Management',
                desc: 'Store, categorize, and organize academic notes cleanly.',
                icon: FolderOpen,
              },
              {
                title: 'Planner & Tasks',
                desc: 'Stay on top of schedules, assignments, and study sessions.',
                icon: Calendar,
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="p-5 rounded-2xl border border-border/60 bg-card space-y-2.5 hover:border-primary/40 transition-colors">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="size-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{APP_TAGLINE} · © {new Date().getFullYear()} {APP_NAME}</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
