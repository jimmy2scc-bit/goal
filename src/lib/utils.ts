import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { XPLevel } from '../types'

// ─── Class utility ───────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── ID generation ───────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID()
}

// ─── Date utilities ──────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in local timezone */
export function getTodayDate(): string {
  const d = new Date()
  return toISODate(d)
}

/** Converts a Date to YYYY-MM-DD local */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns dates for the last N days including today (local) */
export function getLastNDates(n: number): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(toISODate(d))
  }
  return dates
}

/** Formats a YYYY-MM-DD date to locale string */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Returns all dates in a given month as YYYY-MM-DD */
export function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = []
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    dates.push(toISODate(date))
  }
  return dates
}

// ─── XP / Levels ─────────────────────────────────────────────────────────────

const XP_PER_GOAL = 10
const XP_PERFECT_DAY = 20

export { XP_PER_GOAL, XP_PERFECT_DAY }

const LEVELS = [
  { level: 1, title: 'Novato', xpRequired: 0 },
  { level: 2, title: 'Aprendiz', xpRequired: 100 },
  { level: 3, title: 'Practicante', xpRequired: 250 },
  { level: 4, title: 'Comprometido', xpRequired: 500 },
  { level: 5, title: 'Disciplinado', xpRequired: 1000 },
  { level: 6, title: 'Constante', xpRequired: 2000 },
  { level: 7, title: 'Experto', xpRequired: 3500 },
  { level: 8, title: 'Maestro', xpRequired: 6000 },
  { level: 9, title: 'Élite', xpRequired: 10000 },
  { level: 10, title: 'Legendario', xpRequired: 20000 },
]

export function computeLevel(totalXP: number): XPLevel {
  let current = LEVELS[0]
  let next = LEVELS[1]

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXP >= LEVELS[i].xpRequired) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? LEVELS[LEVELS.length - 1]
    } else {
      break
    }
  }

  const xpInCurrentLevel = totalXP - current.xpRequired
  const xpForNextLevel = next.xpRequired - current.xpRequired
  const progressPercent =
    current.level === 10
      ? 100
      : Math.min(100, Math.round((xpInCurrentLevel / xpForNextLevel) * 100))

  return {
    level: current.level,
    title: current.title,
    totalXP,
    xpForNextLevel,
    xpInCurrentLevel,
    progressPercent,
  }
}

// ─── Streak calculation ───────────────────────────────────────────────────────

/**
 * Given an array of {date, status} sorted descending,
 * returns { current, best } streaks.
 */
export function calcStreaks(
  entries: Array<{ date: string; status: string }>
): { current: number; best: number } {
  if (entries.length === 0) return { current: 0, best: 0 }

  // sort ascending
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))

  let best = 0
  let current = 0
  let prev: string | null = null

  for (const entry of sorted) {
    if (entry.status !== 'completed') {
      best = Math.max(best, current)
      current = 0
      prev = null
      continue
    }

    if (prev === null) {
      current = 1
    } else {
      const prevDate = new Date(prev)
      const thisDate = new Date(entry.date)
      const diff = Math.round(
        (thisDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diff === 1) {
        current++
      } else {
        best = Math.max(best, current)
        current = 1
      }
    }
    prev = entry.date
  }

  best = Math.max(best, current)

  // Check if streak is still active (last completed date = today or yesterday)
  const lastCompleted = sorted.filter((e) => e.status === 'completed').at(-1)
  if (lastCompleted) {
    const today = getTodayDate()
    const yesterday = toISODate(
      new Date(new Date().setDate(new Date().getDate() - 1))
    )
    if (
      lastCompleted.date !== today &&
      lastCompleted.date !== yesterday
    ) {
      current = 0
    }
  } else {
    current = 0
  }

  return { current, best }
}
