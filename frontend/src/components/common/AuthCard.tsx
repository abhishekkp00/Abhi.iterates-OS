import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { scaleVariants } from '@/lib/animations'

interface AuthCardProps {
  children: ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <motion.div
      variants={scaleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-[400px] border border-border bg-card p-6 shadow-lg rounded-xl md:p-8"
    >
      {children}
    </motion.div>
  )
}
