import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-zinc-900/60 border border-zinc-800/80 rounded-2xl',
        hover && 'hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'
