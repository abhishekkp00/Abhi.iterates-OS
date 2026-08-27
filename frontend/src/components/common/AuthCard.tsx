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
      className="w-full max-w-[420px] border border-slate-800 bg-[#151c2c] p-6 shadow-2xl rounded-2xl md:p-8"
    >
      {children}
    </motion.div>
  )
}
