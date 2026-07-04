import { Loader2 } from '@/lib/icons'
import { motion } from 'framer-motion'
import { fadeVariants } from '@/lib/animations'

interface LoadingOverlayProps {
  label?: string
}

export function LoadingOverlay({ label = 'Please wait...' }: LoadingOverlayProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[2px] rounded-xl"
    >
      <Loader2 className="size-6 animate-spin text-primary" />
      {label && <p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p>}
    </motion.div>
  )
}
