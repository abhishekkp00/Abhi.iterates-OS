import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  Rocket,
  BookOpen,
  Bot,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Command,
  ShieldCheck,
  Zap,
  GraduationCap,
} from '@/lib/icons'

export interface TourStep {
  id: string
  title: string
  subtitle: string
  badge: string
  badgeColor: string
  icon: any
  iconColor: string
  navLocation: string
  description: string
  features: { icon: any; title: string; desc: string }[]
  keyShortcut?: string
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Abhi.Iterates-OS',
    subtitle: 'Your Intelligent Academic Command Center',
    badge: 'Overview',
    badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    icon: Rocket,
    iconColor: 'text-indigo-400',
    navLocation: 'Main Workspace',
    description:
      'Abhi.Iterates-OS is an all-in-one operating system designed for modern students and educators. It combines AI tutoring, study resource management, placement prep stores, and focus tools into a single dynamic platform.',
    features: [
      {
        icon: Sparkles,
        title: 'Unified Student Hub',
        desc: 'Access all your notes, tasks, AI sessions, and campus marketplace in one sleek dashboard.',
      },
      {
        icon: Command,
        title: 'Global Command Menu',
        desc: 'Press ⌘K (or Ctrl+K) anywhere to instantly search pages, features, or jump to resources.',
      },
      {
        icon: ShieldCheck,
        title: 'Production Hardened Security',
        desc: 'Protected by Spring Security, stateless JWT auth, and role-based access controls.',
      },
    ],
    keyShortcut: 'Press ⌘K anytime',
  },
  {
    id: 'resources',
    title: 'Academic Resources & Notes',
    subtitle: 'Organized Study Notes & Assignment Vault',
    badge: 'Study Library',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: BookOpen,
    iconColor: 'text-blue-400',
    navLocation: 'Sidebar ➔ Resources',
    description:
      'Keep your study materials structured. Store subject notes, lab manuals, and syllabus guidelines with rich metadata and instant filtering.',
    features: [
      {
        icon: Zap,
        title: 'Multi-Filter Search',
        desc: 'Filter resources by Subject, Semester, Priority (High/Medium/Low), or custom tags.',
      },
      {
        icon: BookOpen,
        title: 'Inline PDF Reader',
        desc: 'Read uploaded PDF notes directly in the browser with zoom and search capabilities.',
      },
      {
        icon: GraduationCap,
        title: 'Course Rating & Reviews',
        desc: 'Rate helpful notes and discover top-voted student prep materials.',
      },
    ],
  },
  {
    id: 'ai-chat',
    title: 'AI Study Assistant (Gemini Agent)',
    subtitle: '24/7 Intelligent Academic Tutor',
    badge: 'AI Powered',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Bot,
    iconColor: 'text-purple-400',
    navLocation: 'Sidebar ➔ AI Chat',
    description:
      'Stuck on a tricky problem or need a quick exam revision? Your built-in Gemini AI Assistant answers questions, generates summaries, and executes agent tools.',
    features: [
      {
        icon: Bot,
        title: 'Context-Aware AI Tutor',
        desc: 'Ask questions about Data Structures, DBMS, System Design, or Calculus.',
      },
      {
        icon: Sparkles,
        title: 'Autonomous Agent Tools',
        desc: 'The AI can search your study notes, query marketplace items, or pull user profile data dynamically.',
      },
      {
        icon: Zap,
        title: 'Exam Flashcard Generator',
        desc: 'Generate topic summaries and key formulas before campus tests.',
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'Student Marketplace & Notes Store',
    subtitle: 'Handwritten Notes & Placement Masterkits',
    badge: 'Marketplace',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: ShoppingBag,
    iconColor: 'text-emerald-400',
    navLocation: 'Sidebar ➔ Store',
    description:
      'Explore premium placement resources and handwritten notes uploaded by top-performing students and verified administrators.',
    features: [
      {
        icon: ShoppingBag,
        title: 'Placement Prep Masterkits',
        desc: 'Access curated MAANG interview guides, System Design templates, and SQL query banks.',
      },
      {
        icon: Zap,
        title: 'UPI Instant QR Payment',
        desc: 'Pay nominal Indian currency (₹) using GPay, PhonePe, or Paytm for instant note unlock.',
      },
      {
        icon: ShieldCheck,
        title: 'Secure Access & Expiry',
        desc: 'Purchased resources remain linked to your account with administrator-configured validity windows.',
      },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity & Focus Suite',
    subtitle: 'Kanban Task Board, Calendar & Pomodoro Timer',
    badge: 'Productivity',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Calendar,
    iconColor: 'text-amber-400',
    navLocation: 'Sidebar ➔ Productivity & Calendar',
    description:
      'Stay on top of assignment submission dates, exam timetables, and project milestones.',
    features: [
      {
        icon: CheckCircle2,
        title: 'KanBan Task Management',
        desc: 'Drag and organize tasks across To-Do, In-Progress, and Completed columns.',
      },
      {
        icon: Calendar,
        title: 'Interactive Study Calendar',
        desc: 'Visualize deadlines, schedule study sessions, and avoid last-minute stress.',
      },
      {
        icon: Zap,
        title: 'Pomodoro Timer',
        desc: 'Boost focus with custom work/break intervals directly on your dashboard.',
      },
    ],
  },
]

export function OnboardingModal() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const storageKey = `abhi_os_onboarding_completed_${user?.id || 'default'}`

  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Auto-open modal ONLY on fresh user sign-up if not already completed
  useEffect(() => {
    if (isAuthenticated) {
      const isNewSignup = sessionStorage.getItem('abhi_os_new_signup') === 'true'
      const hasCompleted = localStorage.getItem(storageKey)

      if (isNewSignup && !hasCompleted) {
        setIsOpen(true)
        sessionStorage.removeItem('abhi_os_new_signup')
      }
    }
  }, [isAuthenticated, storageKey])

  // Listen for manual trigger (e.g. from user menu or navbar)
  useEffect(() => {
    function handleManualTrigger() {
      setCurrentStep(0)
      setIsOpen(true)
    }
    window.addEventListener('open-onboarding-tour', handleManualTrigger)
    return () => window.removeEventListener('open-onboarding-tour', handleManualTrigger)
  }, [])

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'Escape') {
        handleSkip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep])

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true')
    sessionStorage.removeItem('abhi_os_new_signup')
    setIsOpen(false)
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    sessionStorage.removeItem('abhi_os_new_signup')
    setIsOpen(false)
  }

  if (!isOpen) return null

  const step = TOUR_STEPS[currentStep]!
  const IconComponent = step.icon
  const isFinalStep = currentStep === TOUR_STEPS.length - 1
  const progressPercent = ((currentStep + 1) / TOUR_STEPS.length) * 100

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Overlay backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl z-10 flex flex-col max-h-[90vh]"
          >
            {/* Top Animated Progress Bar */}
            <div className="h-1.5 w-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            </div>

            {/* Header Controls */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${step.badgeColor}`}>
                  {step.badge}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Navigation: <strong className="text-foreground">{step.navLocation}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted font-medium"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleSkip}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close tour"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="px-6 py-4 space-y-5 overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Step Title & Icon */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-muted/70 border border-border shrink-0">
                      <IconComponent className={`size-7 ${step.iconColor}`} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                        {step.title}
                      </h2>
                      <p className="text-xs text-muted-foreground font-medium">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Step Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Feature Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {step.features.map((feat, idx) => {
                      const FeatIcon = feat.icon
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1.5 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                            <FeatIcon className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">{feat.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-normal">
                            {feat.desc}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card/50 backdrop-blur-sm shrink-0">
              {/* Step Counter Dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? 'w-6 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                    }`}
                    aria-label={`Go to tour step ${idx + 1}`}
                  />
                ))}
                <span className="text-[11px] text-muted-foreground ml-2 font-mono">
                  {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="text-xs h-8"
                >
                  <ChevronLeft className="size-3.5 mr-1" />
                  Back
                </Button>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="text-xs h-8 min-w-[90px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isFinalStep ? (
                    <>
                      Get Started
                      <Sparkles className="size-3.5 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="size-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
