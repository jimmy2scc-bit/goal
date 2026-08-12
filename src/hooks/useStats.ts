import { useQuery } from '@tanstack/react-query'
import { getAllCheckIns, getTotalXP, getGoals } from '../api'
import { calcStreaks, computeLevel, getLastNDates, getMonthDates, toISODate } from '../lib/utils'
import type { GoalStats, XPLevel, Goal } from '../types'

export function useXP(): { totalXP: number; level: XPLevel; isLoading: boolean } {
  const { data: totalXP = 0, isLoading } = useQuery({
    queryKey: ['xp'],
    queryFn: getTotalXP,
  })
  return { totalXP, level: computeLevel(totalXP), isLoading }
}

export function useGoalStats(goalId: string): { stats: GoalStats; isLoading: boolean } {
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: getAllCheckIns,
  })

  const goalCheckIns = checkIns.filter((c) => c.goal_id === goalId)
  const { current: current_streak, best: best_streak } = calcStreaks(goalCheckIns)

  const last7 = getLastNDates(7)
  const last30 = getLastNDates(30)

  const rate = (dates: string[]) => {
    const relevant = goalCheckIns.filter((c) => dates.includes(c.date))
    const completed = relevant.filter((c) => c.status === 'completed').length
    return dates.length > 0 ? Math.round((completed / dates.length) * 100) : 0
  }

  return {
    stats: {
      goal_id: goalId,
      current_streak,
      best_streak,
      completion_rate_7d: rate(last7),
      completion_rate_30d: rate(last30),
    },
    isLoading,
  }
}

export function useCalendarData(
  goalId: string,
  year: number,
  month: number
): { data: Record<string, string>; isLoading: boolean } {
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: getAllCheckIns,
  })

  const goalCheckIns = checkIns.filter((c) => c.goal_id === goalId)
  const data: Record<string, string> = {}

  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const ci = goalCheckIns.find((c) => c.date === dateStr)
    if (ci) data[dateStr] = ci.status
  }

  return { data, isLoading }
}

export type GlobalDayStatus = 'perfect' | 'partial' | 'failed' | 'empty'

export interface GlobalDayData {
  date: string
  status: GlobalDayStatus
  completedCount: number
  failedCount: number
  totalGoals: number
}

export function useGlobalMonthlyCalendar(year: number, month: number) {
  const { data: checkIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: getAllCheckIns,
  })
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  })

  const dates = getMonthDates(year, month)
  const daysMap: Record<string, GlobalDayData> = {}

  for (const date of dates) {
    const dayCheckIns = checkIns.filter((c) => c.date === date)
    const completedCount = dayCheckIns.filter((c) => c.status === 'completed').length
    const failedCount = dayCheckIns.filter((c) => c.status === 'failed').length
    const totalGoals = goals.length

    let status: GlobalDayStatus = 'empty'
    if (totalGoals > 0 && completedCount === totalGoals) {
      status = 'perfect'
    } else if (failedCount > 0 && completedCount === 0) {
      status = 'failed'
    } else if (completedCount > 0 || failedCount > 0) {
      status = 'partial'
    }

    daysMap[date] = { date, status, completedCount, failedCount, totalGoals }
  }

  return { daysMap, dates, isLoading: loadingCheckIns || loadingGoals }
}

export interface WeeklyTrendData {
  weekLabel: string
  completionRate: number
  startDate: string
  endDate: string
}

export function useWeeklyTrendStats() {
  const { data: checkIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: getAllCheckIns,
  })
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  })

  const weeks: WeeklyTrendData[] = []
  const today = new Date()

  for (let i = 3; i >= 0; i--) {
    const end = new Date(today)
    end.setDate(end.getDate() - i * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)

    const dateStrings: string[] = []
    const cur = new Date(start)
    while (cur <= end) {
      dateStrings.push(toISODate(cur))
      cur.setDate(cur.getDate() + 1)
    }

    let totalPossible = dateStrings.length * goals.length
    let completed = 0

    if (totalPossible > 0) {
      completed = checkIns.filter(
        (c) => dateStrings.includes(c.date) && c.status === 'completed'
      ).length
    }

    const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0

    const weekLabel = i === 0 ? 'Esta sem.' : `Hace ${i} sem.`
    weeks.push({
      weekLabel,
      completionRate,
      startDate: toISODate(start),
      endDate: toISODate(end),
    })
  }

  return { weeks, isLoading: loadingCheckIns || loadingGoals }
}

export interface GlobalOverviewMetrics {
  totalPerfectDays: number
  overallRate30d: number
  bestGoal: Goal | null
  strugglingGoal: Goal | null
  totalCheckIns: number
}

export function useGlobalOverviewMetrics() {
  const { data: checkIns = [], isLoading: loadingCheckIns } = useQuery({
    queryKey: ['allCheckIns'],
    queryFn: getAllCheckIns,
  })
  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  })

  // Perfect days count
  const allDates = [...new Set(checkIns.map((c) => c.date))]
  let totalPerfectDays = 0

  for (const date of allDates) {
    const dayCheckIns = checkIns.filter((c) => c.date === date)
    const isPerfect =
      goals.length > 0 &&
      goals.every((g) =>
        dayCheckIns.some((c) => c.goal_id === g.id && c.status === 'completed')
      )
    if (isPerfect) totalPerfectDays++
  }

  // 30d global rate
  const last30 = getLastNDates(30)
  const last30Possible = last30.length * goals.length
  const last30Completed = checkIns.filter(
    (c) => last30.includes(c.date) && c.status === 'completed'
  ).length
  const overallRate30d = last30Possible > 0 ? Math.round((last30Completed / last30Possible) * 100) : 0

  // Best & Struggling goal by 30d completion rate
  let bestGoal: Goal | null = null
  let strugglingGoal: Goal | null = null
  let maxRate = -1
  let minRate = 101

  for (const goal of goals) {
    const relevant = checkIns.filter((c) => c.goal_id === goal.id && last30.includes(c.date))
    const rate = last30.length > 0 ? Math.round((relevant.filter((c) => c.status === 'completed').length / last30.length) * 100) : 0
    if (rate > maxRate) {
      maxRate = rate
      bestGoal = goal
    }
    if (rate < minRate) {
      minRate = rate
      strugglingGoal = goal
    }
  }

  return {
    metrics: {
      totalPerfectDays,
      overallRate30d,
      bestGoal,
      strugglingGoal,
      totalCheckIns: checkIns.filter((c) => c.status === 'completed').length,
    },
    isLoading: loadingCheckIns || loadingGoals,
  }
}
