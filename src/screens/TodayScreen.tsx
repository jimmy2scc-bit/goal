import { useGoals } from '../hooks/useGoals'
import { useCheckIns, useUpsertCheckIn } from '../hooks/useCheckIns'
import { useXP } from '../hooks/useStats'
import { usePendingIncidents } from '../hooks/usePunishments'
import { getTodayDate, formatDate } from '../lib/utils'
import { GoalIconBadge } from '../components/goals/GoalIconBadge'
import { CheckInButton } from '../components/goals/CheckInButton'
import { Card } from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'
import { cn } from '../lib/utils'
import type { CheckInStatus } from '../types'
import toast from 'react-hot-toast'
import { Trophy, AlertTriangle } from 'lucide-react'

const today = getTodayDate()

export function TodayScreen() {
  const { data: goals = [], isLoading: goalsLoading } = useGoals()
  const { data: checkIns = [], isLoading: checkInsLoading } = useCheckIns(today)
  const { totalXP, level } = useXP()
  const { data: incidents = [] } = usePendingIncidents()
  const upsert = useUpsertCheckIn(today)

  const getStatus = (goalId: string): CheckInStatus => {
    return checkIns.find((c) => c.goal_id === goalId)?.status ?? 'pending'
  }

  const handleMark = (goalId: string, status: CheckInStatus) => {
    const prev = getStatus(goalId)
    if (prev === status) status = 'pending'

    upsert.mutate(
      { goalId, status },
      {
        onSuccess: () => {
          if (status === 'completed') toast.success('+10 XP 🎯', { duration: 1500 })
          if (status === 'failed') toast.error('Meta fallada ⚠️', { duration: 2000 })
        },
      }
    )
  }

  const completedCount = goals.filter((g) => getStatus(g.id) === 'completed').length
  const failedCount = goals.filter((g) => getStatus(g.id) === 'failed').length
  const isPerfectDay = goals.length > 0 && completedCount === goals.length

  if (goalsLoading || checkInsLoading) return <PageSpinner />

  return (
    <div className="space-y-5">
      {/* Date header */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-0.5">
          {formatDate(today)}
        </p>
        <h2 className="text-2xl font-bold text-zinc-100">
          {isPerfectDay ? '¡Día perfecto! 🏆' : 'Vista de Hoy'}
        </h2>
      </div>

      {/* XP Widget */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              Nivel {level.level} · {level.title}
            </p>
            <p className="text-xl font-bold text-purple-400">{totalXP} XP</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Siguiente nivel</p>
            <p className="text-sm font-semibold text-zinc-300">
              {level.xpInCurrentLevel} / {level.xpForNextLevel} XP
            </p>
          </div>
        </div>
        {/* XP bar */}
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${level.progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Stats row */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{completedCount}</p>
            <p className="text-xs text-zinc-500">Completadas</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-zinc-400">
              {goals.length - completedCount - failedCount}
            </p>
            <p className="text-xs text-zinc-500">Pendientes</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-red-400">{failedCount}</p>
            <p className="text-xs text-zinc-500">Falladas</p>
          </div>
        </div>
      )}

      {/* Pending debts */}
      {incidents.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            Tienes <span className="font-bold">{incidents.length} deuda{incidents.length !== 1 ? 's' : ''}</span> pendiente{incidents.length !== 1 ? 's' : ''}.
          </p>
        </div>
      )}

      {/* Perfect day banner */}
      {isPerfectDay && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl">
          <Trophy size={20} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-300">¡Día Perfecto!</p>
            <p className="text-xs text-amber-400/70">+20 XP bonus desbloqueado</p>
          </div>
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-2">
        <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Metas del día</h3>
        {goals.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-zinc-500 text-sm">
              Todavía no tienes metas. Crea una en la pestaña <span className="text-purple-400">Metas</span>.
            </p>
          </Card>
        ) : (
          goals.map((goal) => {
            const status = getStatus(goal.id)
            return (
              <Card
                key={goal.id}
                className={cn(
                  'p-4 flex items-center gap-4 transition-all duration-200',
                  status === 'completed' && 'border-emerald-500/20 bg-emerald-500/5',
                  status === 'failed' && 'border-red-500/20 bg-red-500/5'
                )}
              >
                <GoalIconBadge icon={goal.icon} color={goal.color} size={20} />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-sm truncate transition-all',
                      status === 'completed' && 'text-emerald-300 line-through opacity-70',
                      status === 'failed' && 'text-red-300',
                      status === 'pending' && 'text-zinc-100'
                    )}
                  >
                    {goal.name}
                  </p>
                  {status === 'completed' && (
                    <p className="text-xs text-emerald-500/70">+10 XP</p>
                  )}
                  {status === 'failed' && (
                    <p className="text-xs text-red-500/70">Castigo activado</p>
                  )}
                </div>
                <CheckInButton
                  status={status}
                  onMark={(s) => handleMark(goal.id, s)}
                  loading={upsert.isPending}
                />
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
