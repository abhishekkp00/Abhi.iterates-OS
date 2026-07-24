import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/store/theme.store'
import { APP_NAME, APP_TAGLINE } from '@/constants/app'
import {
  GraduationCap, Sparkles, ArrowRight, BookOpen,
  FolderOpen, Calendar, Sun, Moon, Bot, ShoppingBag,
  CheckCircle2, BarChart3, Zap,
} from '@/lib/icons'

// ── Mascot: SVG student owl with eye-tracking ────────────────────────────────
function MascotOwl({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const [eyeOffset, setEyeOffset] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 })

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const angle = Math.atan2(mouseY - cy, mouseX - cx)
    const dist = Math.min(3.5, Math.hypot(mouseX - cx, mouseY - cy) / 60)
    const ox = Math.cos(angle) * dist
    const oy = Math.sin(angle) * dist
    setEyeOffset({ lx: ox, ly: oy, rx: ox, ry: oy })
  }, [mouseX, mouseY])

  return (
    <svg ref={ref} viewBox="0 0 120 140" width="140" height="140" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="60" cy="95" rx="38" ry="42" fill="#6366f1" opacity="0.9" />
      {/* Wing left */}
      <ellipse cx="26" cy="100" rx="14" ry="22" fill="#4f46e5" transform="rotate(-15 26 100)" />
      {/* Wing right */}
      <ellipse cx="94" cy="100" rx="14" ry="22" fill="#4f46e5" transform="rotate(15 94 100)" />
      {/* Head */}
      <circle cx="60" cy="54" r="34" fill="#818cf8" />
      {/* Ear tufts */}
      <polygon points="40,25 33,8 47,20" fill="#6366f1" />
      <polygon points="80,25 87,8 73,20" fill="#6366f1" />
      {/* Face disc */}
      <ellipse cx="60" cy="58" rx="26" ry="24" fill="#e0e7ff" opacity="0.6" />
      {/* Left eye white */}
      <circle cx="48" cy="52" r="11" fill="white" />
      {/* Right eye white */}
      <circle cx="72" cy="52" r="11" fill="white" />
      {/* Left pupil */}
      <circle cx={48 + eyeOffset.lx} cy={52 + eyeOffset.ly} r="5.5" fill="#1e1b4b" />
      <circle cx={49.5 + eyeOffset.lx} cy={50.5 + eyeOffset.ly} r="1.8" fill="white" />
      {/* Right pupil */}
      <circle cx={72 + eyeOffset.rx} cy={52 + eyeOffset.ry} r="5.5" fill="#1e1b4b" />
      <circle cx={73.5 + eyeOffset.rx} cy={50.5 + eyeOffset.ry} r="1.8" fill="white" />
      {/* Beak */}
      <polygon points="60,62 54,70 66,70" fill="#fbbf24" />
      {/* Belly pattern */}
      <ellipse cx="60" cy="105" rx="18" ry="22" fill="#c7d2fe" opacity="0.5" />
      {/* Graduation cap */}
      <rect x="34" y="22" width="52" height="7" rx="2" fill="#1e1b4b" />
      <rect x="55" y="15" width="10" height="8" rx="1" fill="#1e1b4b" />
      <line x1="82" y1="24" x2="90" y2="36" stroke="#fbbf24" strokeWidth="2" />
      <circle cx="90" cy="38" r="3" fill="#fbbf24" />
      {/* Feet */}
      <ellipse cx="48" cy="135" rx="10" ry="5" fill="#fbbf24" />
      <ellipse cx="72" cy="135" rx="10" ry="5" fill="#fbbf24" />
    </svg>
  )
}

// ── Floating orb background ──────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      <motion.div
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/10 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-violet-500/15 to-primary/10 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute bottom-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-amber-500/10 to-orange-400/5 blur-3xl"
        animate={{ x: [0, 15, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
    </div>
  )
}

// ── Floating stat badge ──────────────────────────────────────────────────────
function FloatBadge({ children, delay, x, y }: { children: React.ReactNode; delay: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-card/90 backdrop-blur-sm shadow-lg text-xs font-semibold text-foreground"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ delay, duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// ── Feature card ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: BookOpen,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    title: 'Smart Library',
    desc: 'Upload PDFs, annotate, highlight, and read with a full-featured study room.',
  },
  {
    icon: Bot,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'AI Study Assistant',
    desc: 'Chat with your documents. Get instant explanations, summaries, and Q&A.',
  },
  {
    icon: ShoppingBag,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    title: 'Marketplace',
    desc: 'Unlock verified placement notes, campus resources, and premium materials.',
  },
  {
    icon: FolderOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Resource Manager',
    desc: 'Organize cheat sheets, lecture notes, past papers, and assignments.',
  },
  {
    icon: Calendar,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    title: 'Study Planner',
    desc: 'Schedule sessions, track deadlines, and keep tasks under control.',
  },
  {
    icon: BarChart3,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    title: 'Analytics',
    desc: 'Track study progress, resource usage, and productivity trends over time.',
  },
]

// ── Typed text hook ───────────────────────────────────────────────────────────
function useTyped(phrases: string[], speed = 55, pause = 1800) {
  const [display, setDisplay] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[phraseIdx] ?? ''
    const delay = deleting ? speed / 2 : charIdx === current.length ? pause : speed

    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setDisplay(current.slice(0, charIdx + 1))
        setCharIdx((c) => c + 1)
      } else if (!deleting && charIdx === current.length) {
        setDeleting(true)
      } else if (deleting && charIdx > 0) {
        setDisplay(current.slice(0, charIdx - 1))
        setCharIdx((c) => c - 1)
      } else {
        setDeleting(false)
        setPhraseIdx((i) => (i + 1) % phrases.length)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause])

  return display
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { setTheme, resolvedTheme } = useThemeStore()
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  const typed = useTyped([
    'Study Smarter, Not Harder.',
    'Your AI-Powered Study Room.',
    'Notes, PDFs & AI in One Place.',
    'Built for Campus Warriors.',
  ])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY })
  }, [])

  return (
    <div
      className="relative min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >
      <FloatingOrbs />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" />
            </div>
            <span className="text-base font-bold tracking-tight">{APP_NAME}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost" size="icon"
              className="rounded-xl size-9 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Link to="/login">
              <Button variant="ghost" className="text-sm font-medium rounded-xl">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button className="text-sm font-semibold rounded-xl">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex-1 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left: Copy */}
          <motion.div
            className="flex-1 text-center lg:text-left space-y-7"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="secondary" className="px-3.5 py-1 rounded-full text-xs font-medium border border-border bg-muted/60 text-muted-foreground inline-flex items-center gap-1.5">
                <Sparkles className="size-3 text-primary" />
                AI-Powered Academic Workspace
              </Badge>
            </motion.div>

            <div className="space-y-3">
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {APP_TAGLINE}
              </motion.h1>
              {/* Typed subtitle */}
              <motion.div
                className="text-xl sm:text-2xl font-bold text-primary min-h-[2rem]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {typed}
                <span className="animate-pulse text-primary/60">|</span>
              </motion.div>
            </div>

            <motion.p
              className="text-base text-muted-foreground max-w-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              All-in-one platform for notes, PDFs, AI chat, marketplace study material, and productivity tools — designed for students who mean business.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center lg:items-start gap-3 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
            >
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                  Start for Free <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 text-sm font-medium rounded-xl">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              className="flex flex-wrap gap-4 justify-center lg:justify-start text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {['✓ Free to start', '✓ AI-powered', '✓ Secure & private', '✓ Campus-ready'].map((t) => (
                <span key={t} className="flex items-center gap-1 text-emerald-500 font-medium">{t}</span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Animated mascot + floating badges */}
          <motion.div
            className="relative flex-shrink-0 flex items-center justify-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Glowing ring behind mascot */}
            <motion.div
              className="absolute w-56 h-56 rounded-full bg-gradient-to-br from-primary/30 to-indigo-500/20 blur-2xl"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Mascot */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 drop-shadow-2xl"
            >
              <MascotOwl mouseX={mouse.x} mouseY={mouse.y} />
            </motion.div>

            {/* Floating speech bubble */}
            <motion.div
              className="absolute -top-2 -right-4 bg-card border border-border/60 rounded-2xl rounded-bl-none px-3 py-2 shadow-lg text-xs font-semibold text-foreground max-w-[130px]"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: 'spring' }}
            >
              <Sparkles className="size-3 text-primary inline mr-1" />
              Ask me anything!
            </motion.div>

            {/* Floating stat badges */}
            <FloatBadge delay={1.4} x="-110px" y="20px">
              <BookOpen className="size-3.5 text-indigo-400" />
              <span>Library & PDFs</span>
            </FloatBadge>
            <FloatBadge delay={1.7} x="-80px" y="120px">
              <Zap className="size-3.5 text-amber-400" />
              <span>AI-Powered</span>
            </FloatBadge>
            <FloatBadge delay={2.0} x="120px" y="60px">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>Tasks & Planner</span>
            </FloatBadge>
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <motion.div
          className="text-center mb-14 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything you need to excel</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            From AI document chat to study planners — all the tools a serious student needs, unified in one platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                className={`p-6 rounded-2xl border ${f.border} bg-card/60 backdrop-blur-sm hover:shadow-xl transition-all group cursor-default`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className={`size-11 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── CTA Strip ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-3xl mx-auto rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-indigo-500/5 to-violet-500/10 p-10 text-center space-y-5 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 to-indigo-500/5 blur-xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <div className="relative z-10 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to level up your studies?</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Join students who study smarter with AI assistance, organized resources, and powerful productivity tools.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-12 px-10 text-sm font-bold rounded-xl shadow-lg hover:scale-105 transition-transform mt-2">
                Get Started — It's Free <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5 text-primary" />
            {APP_TAGLINE} · © {new Date().getFullYear()} {APP_NAME}
          </span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
