import { cn } from '../../lib/utils'
import type { CheckInStatus } from '../../types'
import { Check, X } from 'lucide-react'

interface CheckInButtonProps {
  status: CheckInStatus
  onMark: (status: CheckInStatus) => void
  loading?: boolean
}

export function CheckInButton({ status, onMark, loading }: CheckInButtonProps) {

  return (
    <div className="flex items-center gap-1.5">
      {/* Completed */}
      <button
        onClick={() => onMark(status === 'completed' ? 'pending' : 'completed')}
        disabled={loading}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-200',
          status === 'completed'
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110'
            : 'border-zinc-700 text-zinc-600 hover:border-emerald-500/60 hover:text-emerald-500/60'
        )}
      >
        <Check size={16} strokeWidth={3} />
      </button>

      {/* Failed */}
      <button
        onClick={() => onMark(status === 'failed' ? 'pending' : 'failed')}
        disabled={loading}
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-200',
          status === 'failed'
            ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
            : 'border-zinc-700 text-zinc-600 hover:border-red-500/60 hover:text-red-500/60'
        )}
      >
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  )
}
