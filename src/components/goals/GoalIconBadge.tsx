import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { GoalIconName } from './goalIcons'

interface DynamicIconProps extends LucideProps {
  name: string
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[name]
  if (!Icon) return <LucideIcons.Target {...props} />
  return <Icon {...props} />
}

interface GoalIconBadgeProps {
  icon: GoalIconName | string
  color: string
  size?: number
}

export function GoalIconBadge({ icon, color, size = 20 }: GoalIconBadgeProps) {
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{
        width: size + 16,
        height: size + 16,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}35`,
      }}
    >
      <DynamicIcon name={icon} size={size} color={color} strokeWidth={1.8} />
    </div>
  )
}
