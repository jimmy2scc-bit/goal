import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import {
  useGoalStats,
  useCalendarData,
  useXP,
  useGlobalOverviewMetrics,
} from '../hooks/useStats'
import { Card } from '../components/ui/Card'
import { GoalIconBadge } from '../components/goals/GoalIconBadge'
import { PageSpinner } from '../components/ui/Spinner'
import { GlobalCalendar } from '../components/stats/GlobalCalendar'
import { WeeklyTrendChart } from '../components/stats/WeeklyTrendChart'
import { GoalComparisonChart } from '../components/stats/GoalComparisonChart'
import { cn, getMonthDates } from '../lib/utils'
import { Flame, Trophy, ChevronDown, Star, AlertTriangle, Target } from 'lucide-react'
import type { Goal } from '../types'

type StatsTab = 'resumen' | 'mensual' | 'metas'

// ─── Per-Goal Heatmap ─────────────────────────────────────────────────────────

function CalendarHeatmap({ goalId, color }: { goalId: string; color: string }) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const { data } = useCalendarData(goalId, year, month)

  const dates = getMonthDates(year, month)
  const firstDow = new Date(year, month - 1, 1).getDay()

  const monthName = now.toLocaleDateString('es', { month: 'long' })

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 capitalize font-medium">{monthName} {year}</p>
      <div className="grid grid-cols-7 gap-1">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
          <div key={d} className="text-center text-[10px] text-zinc-600 pb-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {dates.map((date) => {
          const status = data[date]
          return (
            <div
              key={date}
              className={cn(
                'aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all',
                !status && 'bg-zinc-800/50 text-zinc-600',
                status === 'completed' && 'text-white',
                status === 'failed' && 'bg-red-500/20 text-red-400',
                status === 'pending' && 'bg-zinc-800/50 text-zinc-600'
              )}
              style={
                status === 'completed'
                  ? { backgroundColor: `${color}30`, color }
                  : {}
              }
            >
              {new Date(date + 'T00:00').getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Goal Stats Card ──────────────────────────────────────────────────────────

function GoalStatsCard({ goal }: { goal: Goal }) {
  const [expanded, setExpanded] = useState(false)
  const { stats } = useGoalStats(goal.id)

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <GoalIconBadge icon={goal.icon} color={goal.color} size={18} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-zinc-100 truncate">{goal.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Flame size={11} className="text-orange-400" />
              Racha: <span className="text-zinc-300 font-medium">{stats.current_streak}</span>
            </span>
            <span className="text-xs text-zinc-500">
              7d: <span className="text-zinc-300 font-medium">{stats.completion_rate_7d}%</span>
            </span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-zinc-500 transition-transform flex-shrink-0',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800/60 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                <Flame size={16} />
                <span className="text-xl font-bold">{stats.current_streak}</span>
              </div>
              <p className="text-xs text-zinc-500">Racha actual</p>
            </div>
            <div className="bg-zinc-800/50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Trophy size={16} />
                <span className="text-xl font-bold">{stats.best_streak}</span>
              </div>
              <p className="text-xs text-zinc-500">Mejor racha</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Últimos 7 días', value: stats.completion_rate_7d },
              { label: 'Últimos 30 días', value: stats.completion_rate_30d },
            ].map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">{label}</span>
                  <span
                    className={cn(
                      'font-semibold',
                      value >= 80
                        ? 'text-emerald-400'
                        : value >= 50
                        ? 'text-amber-400'
                        : 'text-red-400'
                    )}
                  >
                    {value}%
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      value >= 80
                        ? 'bg-emerald-500'
                        : value >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    )}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <CalendarHeatmap goalId={goal.id} color={goal.color} />
        </div>
      )}
    </Card>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function StatsScreen() {
  const [tab, setTab] = useState<StatsTab>('resumen')
  const { data: goals = [], isLoading: loadingGoals } = useGoals()
  const { totalXP, level, isLoading: loadingXP } = useXP()
  const { metrics, isLoading: loadingMetrics } = useGlobalOverviewMetrics()

  if (loadingGoals || loadingXP || loadingMetrics) return <PageSpinner />

  const TABS: { id: StatsTab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'mensual', label: 'Vista Mensual' },
    { id: 'metas', label: 'Por Meta' },
  ]

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 gap-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
              tab === id
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── RESUMEN TAB ── */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          {/* XP Level Card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                  Nivel {level.level}
                </p>
                <p className="text-2xl font-extrabold text-zinc-100">{level.title}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">XP Total</p>
                <p className="text-2xl font-extrabold text-purple-400">{totalXP}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{level.xpInCurrentLevel} XP en este nivel</span>
                <span>{level.xpForNextLevel} XP para subir</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${level.progressPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 space-y-1 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <Trophy size={14} /> Días Perfectos
              </div>
              <p className="text-2xl font-extrabold text-emerald-300">{metrics.totalPerfectDays}</p>
              <p className="text-[11px] text-zinc-500">100% metas cumplidas</p>
            </Card>

            <Card className="p-3 space-y-1 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                <Target size={14} /> Promedio 30d
              </div>
              <p className="text-2xl font-extrabold text-purple-300">{metrics.overallRate30d}%</p>
              <p className="text-[11px] text-zinc-500">Cumplimiento global</p>
            </Card>

            {metrics.bestGoal && (
              <Card className="p-3 space-y-1 border-amber-500/20">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                  <Star size={14} /> Meta Estrella
                </div>
                <p className="text-sm font-bold text-zinc-100 truncate">{metrics.bestGoal.name}</p>
                <p className="text-[11px] text-amber-400/80">Mejor consistencia</p>
              </Card>
            )}

            {metrics.strugglingGoal && (
              <Card className="p-3 space-y-1 border-red-500/20">
                <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold">
                  <AlertTriangle size={14} /> Meta Crítica
                </div>
                <p className="text-sm font-bold text-zinc-100 truncate">{metrics.strugglingGoal.name}</p>
                <p className="text-[11px] text-red-400/80">Requiere atención</p>
              </Card>
            )}
          </div>

          {/* Weekly Trend Chart */}
          <WeeklyTrendChart />

          {/* Goal Comparison Bar Chart */}
          <GoalComparisonChart />
        </div>
      )}

      {/* ── VISTA MENSUAL TAB ── */}
      {tab === 'mensual' && (
        <div className="space-y-4">
          <GlobalCalendar />
        </div>
      )}

      {/* ── POR META TAB ── */}
      {tab === 'metas' && (
        <div className="space-y-2">
          {goals.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-zinc-500 text-sm">Crea metas para ver estadísticas por meta.</p>
            </Card>
          ) : (
            goals.map((goal) => <GoalStatsCard key={goal.id} goal={goal} />)
          )}
        </div>
      )}
    </div>
  )
}
