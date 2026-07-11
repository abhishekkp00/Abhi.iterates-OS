import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Pencil } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="page-container max-w-4xl">
      <motion.div
        variants={staggerParentVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Header with Back & Edit buttons */}
        <motion.div
          variants={staggerChildVariants}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-4">
            <Link to="/resources">
              <Button variant="ghost" size="sm" className="gap-1.5 -ml-3">
                <ArrowLeft className="size-4" />
                <span>Back to Resources</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Resource Details
              </h1>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                ID: {id}
              </p>
            </div>
          </div>

          <Link to={`/resources/${id}/edit`}>
            <Button size="sm" className="gap-1.5">
              <Pencil className="size-4" />
              <span>Edit Resource</span>
            </Button>
          </Link>
        </motion.div>

        {/* Content area placeholder */}
        <motion.div
          variants={staggerChildVariants}
          className="rounded-xl border border-dashed border-border bg-card p-12 text-center"
        >
          <p className="text-sm font-semibold text-foreground">Details View Placeholder</p>
          <p className="text-xs text-muted-foreground mt-2">
            The full details view containing file preview, activity logs, and edit/delete actions will be implemented in Step 7.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
