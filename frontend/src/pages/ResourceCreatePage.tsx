import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { ResourceForm, type ResourceFormValues } from '@/features/resources/components/ResourceForm'
import { useCreateResourceMutation } from '@/features/resources/hooks/useResources'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'

export default function ResourceCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateResourceMutation()

  async function handleSubmit(values: ResourceFormValues): Promise<string | undefined> {
    const data = await createMutation.mutateAsync({
      title: values.title,
      description: values.description,
      category: values.category,
      priority: values.priority,
      status: values.status,
      tags: values.tags,
    })
    return data.id
  }

  function handleSuccess(id: string) {
    navigate(`/resources/${id}`)
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
          <Link to="/library">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-3 cursor-pointer">
              <ArrowLeft className="size-4" />
              <span>Back to Library</span>
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

        <motion.div variants={staggerChildVariants}>
          <ResourceForm onSubmit={handleSubmit} submitLabel="Create Resource" onSuccess={handleSuccess} />
        </motion.div>
      </motion.div>
    </div>
  )
}
