import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'

export default function ResourceCreatePage() {
  return (
    <div className="page-container max-w-3xl">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Header with Back button */}
        <motion.div variants={staggerChildVariants} className="space-y-4">
          <Link to="/resources">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-3">
              <ArrowLeft className="size-4" />
              <span>Back to Resources</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Add New Resource
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a document or link, categorize it, and set study priority.
            </p>
          </div>
        </motion.div>

        {/* Content area placeholder */}
        <motion.div
          variants={staggerChildVariants}
          className="rounded-xl border border-dashed border-border bg-card p-12 text-center"
        >
          <p className="text-sm font-semibold text-foreground">Form Placeholder</p>
          <p className="text-xs text-muted-foreground mt-2">
            The full Resource Creation form with file uploads, tags, and validation will be implemented in Step 4.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
