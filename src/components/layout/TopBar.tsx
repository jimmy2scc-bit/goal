import { Shield } from 'lucide-react'
import { useXP } from '../../hooks/useStats'
import { usePendingIncidents } from '../../hooks/usePunishments'

interface TopBarProps {
  title: string
  action?: React.ReactNode
}

export function TopBar({ title, action }: TopBarProps) {
  const { level } = useXP()
  const { data: incidents = [] } = usePendingIncidents()
  const debtCount = incidents.length

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-purple-400" />
          </div>
          <h1 className="text-base font-semibold text-zinc-100 truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {debtCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 border border-red-500/30 rounded-full text-red-400 text-xs font-semibold">
              ⚠️ {debtCount} deuda{debtCount !== 1 ? 's' : ''}
            </span>
          )}
          <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold">
            Nv. {level.level}
          </span>
          {action}
        </div>
      </div>
    </header>
  )
}
