import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { ResourceForm, type ResourceFormValues } from '@/features/resources/components/ResourceForm'
import { staggerParentVariants, staggerChildVariants } from '@/lib/animations'
import { toast } from 'sonner'

export default function ResourceEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // In Step 5/6, we'll fetch actual initial data using TanStack Query.
  // For now, we stub realistic initial data.
  const mockInitialData: Partial<ResourceFormValues> = {
    title: 'Algorithms & Complexity Cheat Sheet',
    description: 'Quick reference guide covering Sorting, Big-O, Graph traversals (DFS/BFS), and dynamic programming paradigms.',
    category: 'CHEATSHEET',
    priority: 'HIGH',
    status: 'ACTIVE',
    deadline: '2026-07-20T23:59:59Z',
    tags: 'algorithms, cheatsheet, computer-science',
  }

  async function handleSubmit(values: ResourceFormValues) {
    // Simulated API put request delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    console.log(`Updating resource ${id}:`, values)
    toast.success('Resource updated successfully!')
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
          <Link to={`/resources/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-3">
              <ArrowLeft className="size-4" />
              <span>Back to Details</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Edit Resource
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modify resource metadata, adjust deadlines, or toggle urgency status.
            </p>
          </div>
        </motion.div>

        {/* Form Container */}
        <motion.div variants={staggerChildVariants}>
          <ResourceForm
            initialData={mockInitialData}
            onSubmit={handleSubmit}
            submitLabel="Update Resource"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
