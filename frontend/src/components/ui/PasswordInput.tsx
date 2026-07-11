import * as React from 'react'
import { Input, InputProps } from './input'
import { Eye, EyeOff, Lock } from '@/lib/icons'
import { Button } from './button'

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'leftIcon' | 'rightIcon'> {
  showStrength?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <Input
        ref={ref}
        label={label}
        error={error}
        type={showPassword ? 'text' : 'password'}
        leftIcon={<Lock className="size-4" />}
        rightIcon={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hover:bg-transparent text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        }
        className={className}
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
