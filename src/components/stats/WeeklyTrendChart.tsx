import { useWeeklyTrendStats } from '../../hooks/useStats'
import { Card } from '../ui/Card'
import { PageSpinner } from '../ui/Spinner'
import { TrendingUp } from 'lucide-react'

export function WeeklyTrendChart() {
  const { weeks, isLoading } = useWeeklyTrendStats()

  if (isLoading) return <PageSpinner />

  const maxVal = 100

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
          <TrendingUp size={16} className="text-purple-400" />
          Tendencia (Últimas 4 semanas)
        </h3>
        <span className="text-xs text-zinc-500">% Cumplimiento</span>
      </div>

      <div className="h-44 pt-4 pb-2 flex items-end justify-around gap-2 border-b border-zinc-800">
        {weeks.map((w, idx) => {
          const heightPct = Math.max(5, (w.completionRate / maxVal) * 100)
          const isLatest = idx === weeks.length - 1

          return (
            <div key={w.weekLabel} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[11px] font-bold text-zinc-300 group-hover:text-purple-400 transition-colors">
                {w.completionRate}%
              </span>
              <div className="w-full max-w-[36px] bg-zinc-800/60 rounded-t-lg overflow-hidden flex items-end h-32 relative">
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isLatest
                      ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-medium truncate max-w-full">
                {w.weekLabel}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
