import * as React from 'react'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const Switch = ({ checked, onCheckedChange, className, disabled }: SwitchProps) => {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full 
          transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 
          focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? 'bg-primary' : 'bg-muted border border-border/80'}
          ${className}
        `}
      >
        <span
          className={`
            pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 
            transition-transform duration-200
            ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}
          `}
        />
      </button>
    )
}
