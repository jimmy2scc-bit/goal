import { useGoals } from '../../hooks/useGoals'
import { useGoalStats } from '../../hooks/useStats'
import { Card } from '../ui/Card'
import { GoalIconBadge } from '../goals/GoalIconBadge'
import { PageSpinner } from '../ui/Spinner'
import type { Goal } from '../../types'
import { BarChart3 } from 'lucide-react'

function GoalBarRow({ goal }: { goal: Goal }) {
  const { stats, isLoading } = useGoalStats(goal.id)

  if (isLoading) return null

  const rate = stats.completion_rate_30d

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <GoalIconBadge icon={goal.icon} color={goal.color} size={14} />
          <span className="font-semibold text-zinc-200 truncate">{goal.name}</span>
        </div>
        <span className="font-bold text-zinc-300 flex-shrink-0">{rate}%</span>
      </div>
      <div className="h-2 bg-zinc-800/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${rate}%`,
            backgroundColor: goal.color,
            boxShadow: `0 0 8px ${goal.color}50`,
          }}
        />
      </div>
    </div>
  )
}

export function GoalComparisonChart() {
  const { data: goals = [], isLoading } = useGoals()

  if (isLoading) return <PageSpinner />

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
          <BarChart3 size={16} className="text-purple-400" />
          Rendimiento por Meta (Últimos 30 días)
        </h3>
      </div>

      {goals.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">No hay metas creadas.</p>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <GoalBarRow key={g.id} goal={g} />
          ))}
        </div>
      )}
    </Card>
  )
}
