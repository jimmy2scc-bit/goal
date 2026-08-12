import { cn } from '../../lib/utils'
import {
  Home,
  Target,
  Skull,
  BarChart2,
  Settings,
} from 'lucide-react'

export type Tab = 'today' | 'goals' | 'punishments' | 'stats' | 'settings'

const tabs: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'today', label: 'Hoy', Icon: Home },
  { id: 'goals', label: 'Metas', Icon: Target },
  { id: 'punishments', label: 'Castigos', Icon: Skull },
  { id: 'stats', label: 'Stats', Icon: BarChart2 },
  { id: 'settings', label: 'Ajustes', Icon: Settings },
]

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
  debtCount?: number
}

export function BottomNav({ active, onChange, debtCount = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 border-t border-zinc-800/80 backdrop-blur-md safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors',
                isActive ? 'text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {id === 'punishments' && debtCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {debtCount > 9 ? '9+' : debtCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-purple-400' : 'text-zinc-600'
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-purple-500 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
