import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { ResourceForm, type ResourceFormValues } from '@/features/resources/components/ResourceForm'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'
import { toast } from 'sonner'

export default function ResourceCreatePage() {
  const navigate = useNavigate()

  async function handleSubmit(values: ResourceFormValues) {
    // Simulated api post request delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    console.log('Submitting new resource details:', values)
    toast.success('Resource created successfully!')
    navigate('/resources')
  }

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

        {/* Form Container */}
        <motion.div variants={staggerChildVariants}>
          <ResourceForm onSubmit={handleSubmit} submitLabel="Create Resource" />
        </motion.div>
      </motion.div>
    </div>
  )
}
