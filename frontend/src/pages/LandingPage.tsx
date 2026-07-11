import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, Sparkles, ArrowRight } from '@/lib/icons'
import { APP_NAME, APP_TAGLINE } from '@/constants/app'
import { fadeVariants, slideUpVariants } from '@/lib/animations'

export default function LandingPage() {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center"
    >
      <motion.div variants={slideUpVariants} className="space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="size-3" />
            AI-Powered Academic Workspace
          </Badge>
        </div>

        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="size-8" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {APP_NAME}
          </h1>
          <p className="text-lg text-muted-foreground">{APP_TAGLINE}</p>
        </div>

        <p className="text-base text-muted-foreground max-w-md mx-auto">
          One platform for notes, PDFs, AI chat, flashcards, and everything a student needs.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button size="lg" rightIcon={<ArrowRight className="size-4" />}>
              Get Started
            </Button>
          </Link>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
