/**
 * Local Storage Adapter
 * ─────────────────────
 * Implements the full domain API using localStorage.
 * Function signatures are identical to the future Supabase adapter.
 */

import type {
  Goal,
  CheckIn,
  CheckInStatus,
  XPEntry,
  Punishment,
  PunishmentRule,
  PunishmentIncident,
  Reward,
  UserSettings,
} from '../../types'
import { generateId, getTodayDate, XP_PER_GOAL, XP_PERFECT_DAY, calcStreaks, getLastNDates } from '../../lib/utils'

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEYS = {
  goals: 'dos:goals',
  checkIns: 'dos:checkIns',
  xp: 'dos:xp',
  punishments: 'dos:punishments',
  rules: 'dos:punishmentRules',
  incidents: 'dos:incidents',
  rewards: 'dos:rewards',
  settings: 'dos:settings',
}

const LOCAL_USER_ID = 'local-user'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function now(): string {
  return new Date().toISOString()
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function getGoals(): Promise<Goal[]> {
  return load<Goal>(KEYS.goals)
    .filter((g) => !g.archived)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function getAllGoals(): Promise<Goal[]> {
  return load<Goal>(KEYS.goals).sort((a, b) => a.sort_order - b.sort_order)
}

export async function createGoal(
  data: Pick<Goal, 'name' | 'icon' | 'color'>
): Promise<Goal> {
  const goals = load<Goal>(KEYS.goals)
  const maxOrder = goals.reduce((m, g) => Math.max(m, g.sort_order), -1)
  const goal: Goal = {
    id: generateId(),
    user_id: LOCAL_USER_ID,
    name: data.name,
    icon: data.icon,
    color: data.color,
    sort_order: maxOrder + 1,
    archived: false,
    created_at: now(),
    updated_at: now(),
  }
  save(KEYS.goals, [...goals, goal])
  return goal
}

export async function updateGoal(
  id: string,
  data: Partial<Pick<Goal, 'name' | 'icon' | 'color' | 'sort_order' | 'archived'>>
): Promise<Goal> {
  const goals = load<Goal>(KEYS.goals)
  const idx = goals.findIndex((g) => g.id === id)
  if (idx === -1) throw new Error('Goal not found')
  const updated = { ...goals[idx], ...data, updated_at: now() }
  goals[idx] = updated
  save(KEYS.goals, goals)
  return updated
}

export async function deleteGoal(id: string): Promise<void> {
  const goals = load<Goal>(KEYS.goals).filter((g) => g.id !== id)
  save(KEYS.goals, goals)
}

export async function reorderGoals(orderedIds: string[]): Promise<void> {
  const goals = load<Goal>(KEYS.goals)
  orderedIds.forEach((id, idx) => {
    const g = goals.find((x) => x.id === id)
    if (g) { g.sort_order = idx; g.updated_at = now() }
  })
  save(KEYS.goals, goals)
}

// ─── Check-ins ───────────────────────────────────────────────────────────────

export async function getCheckInsForDate(date: string): Promise<CheckIn[]> {
  return load<CheckIn>(KEYS.checkIns).filter((c) => c.date === date)
}

export async function getAllCheckIns(): Promise<CheckIn[]> {
  return load<CheckIn>(KEYS.checkIns)
}

export async function upsertCheckIn(
  goalId: string,
  date: string,
  status: CheckInStatus
): Promise<CheckIn> {
  const checkIns = load<CheckIn>(KEYS.checkIns)
  const existing = checkIns.find(
    (c) => c.goal_id === goalId && c.date === date
  )

  let checkIn: CheckIn
  if (existing) {
    const prev = existing.status
    existing.status = status
    existing.updated_at = now()
    checkIn = existing
    save(KEYS.checkIns, checkIns)

    // If status changed TO failed → trigger punishments
    if (status === 'failed' && prev !== 'failed') {
      await _triggerPunishments(goalId)
    }
    // If status changed FROM failed → undo pending incident (remove)
    if (prev === 'failed' && status !== 'failed') {
      await _revokeLatestIncident(goalId)
    }
  } else {
    checkIn = {
      id: generateId(),
      goal_id: goalId,
      date,
      status,
      created_at: now(),
      updated_at: now(),
    }
    save(KEYS.checkIns, [...checkIns, checkIn])
    if (status === 'failed') {
      await _triggerPunishments(goalId)
    }
  }

  // After upsert, check XP
  await _handleXPForDate(date)

  return checkIn
}

// ─── XP ──────────────────────────────────────────────────────────────────────

export async function getTotalXP(): Promise<number> {
  return load<XPEntry>(KEYS.xp).reduce((sum, e) => sum + e.amount, 0)
}

export async function getXPEntries(): Promise<XPEntry[]> {
  return load<XPEntry>(KEYS.xp)
}

export async function addXP(amount: number, reason: string): Promise<XPEntry> {
  const entries = load<XPEntry>(KEYS.xp)
  const entry: XPEntry = {
    id: generateId(),
    user_id: LOCAL_USER_ID,
    amount,
    reason,
    created_at: now(),
  }
  save(KEYS.xp, [...entries, entry])
  return entry
}

// ─── Punishments ──────────────────────────────────────────────────────────────

export async function getPunishments(): Promise<Punishment[]> {
  return load<Punishment>(KEYS.punishments).filter((p) => !p.archived)
}

export async function getAllPunishments(): Promise<Punishment[]> {
  return load<Punishment>(KEYS.punishments)
}

export async function createPunishment(
  data: Pick<Punishment, 'name' | 'description'>
): Promise<Punishment> {
  const punishments = load<Punishment>(KEYS.punishments)
  const p: Punishment = {
    id: generateId(),
    user_id: LOCAL_USER_ID,
    name: data.name,
    description: data.description,
    archived: false,
    created_at: now(),
    updated_at: now(),
  }
  save(KEYS.punishments, [...punishments, p])
  return p
}

export async function updatePunishment(
  id: string,
  data: Partial<Pick<Punishment, 'name' | 'description' | 'archived'>>
): Promise<Punishment> {
  const punishments = load<Punishment>(KEYS.punishments)
  const idx = punishments.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('Punishment not found')
  const updated = { ...punishments[idx], ...data, updated_at: now() }
  punishments[idx] = updated
  save(KEYS.punishments, punishments)
  return updated
}

export async function deletePunishment(id: string): Promise<void> {
  save(KEYS.punishments, load<Punishment>(KEYS.punishments).filter((p) => p.id !== id))
}

// ─── Punishment Rules ─────────────────────────────────────────────────────────

export async function getPunishmentRules(): Promise<PunishmentRule[]> {
  const rules = load<PunishmentRule>(KEYS.rules)
  const goals = load<Goal>(KEYS.goals)
  const punishments = load<Punishment>(KEYS.punishments)
  return rules.map((r) => ({
    ...r,
    goal: goals.find((g) => g.id === r.goal_id),
    punishment: punishments.find((p) => p.id === r.punishment_id),
  }))
}

export async function createPunishmentRule(
  goalId: string,
  punishmentId: string
): Promise<PunishmentRule> {
  const rules = load<PunishmentRule>(KEYS.rules)
  const exists = rules.some(
    (r) => r.goal_id === goalId && r.punishment_id === punishmentId
  )
  if (exists) throw new Error('Rule already exists')
  const rule: PunishmentRule = {
    id: generateId(),
    goal_id: goalId,
    punishment_id: punishmentId,
    created_at: now(),
    updated_at: now(),
  }
  save(KEYS.rules, [...rules, rule])
  return rule
}

export async function deletePunishmentRule(id: string): Promise<void> {
  save(KEYS.rules, load<PunishmentRule>(KEYS.rules).filter((r) => r.id !== id))
}

// ─── Punishment Incidents ─────────────────────────────────────────────────────

export async function getIncidents(status?: 'pending' | 'completed'): Promise<PunishmentIncident[]> {
  const incidents = load<PunishmentIncident>(KEYS.incidents)
  const filtered = status ? incidents.filter((i) => i.status === status) : incidents
  const rules = load<PunishmentRule>(KEYS.rules)
  const goals = load<Goal>(KEYS.goals)
  const punishments = load<Punishment>(KEYS.punishments)
  return filtered
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((i) => {
      const rule = rules.find((r) => r.id === i.punishment_rule_id)
      return {
        ...i,
        punishment_rule: rule
          ? {
              ...rule,
              goal: goals.find((g) => g.id === rule.goal_id),
              punishment: punishments.find((p) => p.id === rule.punishment_id),
            }
          : undefined,
      }
    })
}

export async function markIncidentComplete(id: string): Promise<void> {
  const incidents = load<PunishmentIncident>(KEYS.incidents)
  const idx = incidents.findIndex((i) => i.id === id)
  if (idx !== -1) {
    incidents[idx].status = 'completed'
    incidents[idx].updated_at = now()
    save(KEYS.incidents, incidents)
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const raw = localStorage.getItem(KEYS.settings)
  if (raw) return JSON.parse(raw) as UserSettings
  const defaults: UserSettings = {
    user_id: LOCAL_USER_ID,
    day_closing_time: '00:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    display_name: 'Usuario',
  }
  localStorage.setItem(KEYS.settings, JSON.stringify(defaults))
  return defaults
}

export async function updateSettings(
  data: Partial<Omit<UserSettings, 'user_id'>>
): Promise<UserSettings> {
  const current = await getSettings()
  const updated = { ...current, ...data }
  localStorage.setItem(KEYS.settings, JSON.stringify(updated))
  return updated
}

// ─── Data management ──────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
}

export async function exportData(): Promise<Record<string, unknown>> {
  return {
    goals: load(KEYS.goals),
    checkIns: load(KEYS.checkIns),
    xp: load(KEYS.xp),
    punishments: load(KEYS.punishments),
    rules: load(KEYS.rules),
    incidents: load(KEYS.incidents),
    rewards: load(KEYS.rewards),
    settings: localStorage.getItem(KEYS.settings),
    exportedAt: new Date().toISOString(),
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function _triggerPunishments(goalId: string): Promise<void> {
  const rules = load<PunishmentRule>(KEYS.rules).filter(
    (r) => r.goal_id === goalId
  )
  if (rules.length === 0) return
  const incidents = load<PunishmentIncident>(KEYS.incidents)
  const today = getTodayDate()
  for (const rule of rules) {
    // Avoid duplicates: one incident per rule per day
    const alreadyToday = incidents.some(
      (i) => i.punishment_rule_id === rule.id && i.created_at.startsWith(today)
    )
    if (alreadyToday) continue
    incidents.push({
      id: generateId(),
      punishment_rule_id: rule.id,
      user_id: LOCAL_USER_ID,
      status: 'pending',
      created_at: now(),
      updated_at: now(),
    })
  }
  save(KEYS.incidents, incidents)
}

async function _revokeLatestIncident(goalId: string): Promise<void> {
  const rules = load<PunishmentRule>(KEYS.rules)
    .filter((r) => r.goal_id === goalId)
    .map((r) => r.id)
  const today = getTodayDate()
  const incidents = load<PunishmentIncident>(KEYS.incidents).filter(
    (i) =>
      !(
        rules.includes(i.punishment_rule_id) &&
        i.status === 'pending' &&
        i.created_at.startsWith(today)
      )
  )
  save(KEYS.incidents, incidents)
}

// Track which dates XP was already awarded to avoid duplicates
const XP_AWARDED_KEY = 'dos:xpAwarded'

function getAwardedDates(): Record<string, { goals: boolean; perfectDay: boolean }> {
  try {
    return JSON.parse(localStorage.getItem(XP_AWARDED_KEY) ?? '{}') as Record<
      string,
      { goals: boolean; perfectDay: boolean }
    >
  } catch {
    return {}
  }
}

async function _handleXPForDate(date: string): Promise<void> {
  const checkIns = load<CheckIn>(KEYS.checkIns).filter((c) => c.date === date)
  const goals = await getGoals()
  const awarded = getAwardedDates()
  if (!awarded[date]) awarded[date] = { goals: false, perfectDay: false }

  // Award XP for each completed goal (once per goal per day)
  const xpEntries = load<XPEntry>(KEYS.xp)
  for (const checkIn of checkIns) {
    if (checkIn.status === 'completed') {
      const alreadyAwarded = xpEntries.some(
        (e) => e.reason === `goal:${checkIn.goal_id}:${date}`
      )
      if (!alreadyAwarded) {
        await addXP(XP_PER_GOAL, `goal:${checkIn.goal_id}:${date}`)
      }
    }
  }

  // Perfect day bonus: all active goals completed
  const allCompleted =
    goals.length > 0 &&
    goals.every((g) =>
      checkIns.some((c) => c.goal_id === g.id && c.status === 'completed')
    )
  const xpEntries2 = load<XPEntry>(KEYS.xp)
  const perfectAlreadyAwarded = xpEntries2.some(
    (e) => e.reason === `perfect:${date}`
  )
  if (allCompleted && !perfectAlreadyAwarded) {
    await addXP(XP_PERFECT_DAY, `perfect:${date}`)
  } else if (!allCompleted) {
    // Remove perfect day XP if un-completing a goal
    const withoutPerfect = xpEntries2.filter(
      (e) => e.reason !== `perfect:${date}`
    )
    if (withoutPerfect.length !== xpEntries2.length) {
      save(KEYS.xp, withoutPerfect)
    }
  }

  // Evaluate rewards after XP changes
  await _evaluateRewards()
}

// ─── Rewards ──────────────────────────────────────────────────────────────────

export async function getRewards(): Promise<Reward[]> {
  return load<Reward>(KEYS.rewards).sort(
    (a, b) => a.created_at.localeCompare(b.created_at)
  )
}

export async function createReward(
  data: Pick<Reward, 'name' | 'description' | 'icon' | 'color' | 'metric_type' | 'target_value'>
): Promise<Reward> {
  const rewards = load<Reward>(KEYS.rewards)
  const reward: Reward = {
    id: generateId(),
    user_id: LOCAL_USER_ID,
    name: data.name,
    description: data.description,
    icon: data.icon,
    color: data.color,
    metric_type: data.metric_type,
    target_value: data.target_value,
    unlocked: false,
    unlocked_at: null,
    claimed: false,
    claimed_at: null,
    created_at: now(),
    updated_at: now(),
  }
  save(KEYS.rewards, [...rewards, reward])
  return reward
}

export async function updateReward(
  id: string,
  data: Partial<Pick<Reward, 'name' | 'description' | 'icon' | 'color' | 'metric_type' | 'target_value'>>
): Promise<Reward> {
  const rewards = load<Reward>(KEYS.rewards)
  const idx = rewards.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error('Reward not found')
  const updated: Reward = { ...rewards[idx], ...data, updated_at: now() }
  rewards[idx] = updated
  save(KEYS.rewards, rewards)
  return updated
}

export async function deleteReward(id: string): Promise<void> {
  save(KEYS.rewards, load<Reward>(KEYS.rewards).filter((r) => r.id !== id))
}

export async function claimReward(id: string): Promise<void> {
  const rewards = load<Reward>(KEYS.rewards)
  const idx = rewards.findIndex((r) => r.id === id)
  if (idx === -1) return
  rewards[idx].claimed = true
  rewards[idx].claimed_at = now()
  rewards[idx].updated_at = now()
  save(KEYS.rewards, rewards)
}

// ─── Reward Evaluation Engine ─────────────────────────────────────────────────

/**
 * Computes the current progress value for a reward metric.
 * Returns { currentValue, unlocks } where unlocks=true if target is met.
 */
export async function computeRewardProgress(
  reward: Reward
): Promise<{ currentValue: number; unlocks: boolean }> {
  const allCheckIns = load<CheckIn>(KEYS.checkIns)
  const goals = await getGoals()
  const xpEntries = load<XPEntry>(KEYS.xp)

  let currentValue = 0

  if (reward.metric_type === 'streak') {
    // Use the global streak across ALL active goals (shortest streak is the chain)
    if (goals.length === 0) {
      currentValue = 0
    } else {
      // Compute per-goal streaks and take the minimum
      const streaks = goals.map((g) => {
        const goalCheckIns = allCheckIns.filter((c) => c.goal_id === g.id)
        return calcStreaks(goalCheckIns).current
      })
      currentValue = Math.min(...streaks)
    }
  } else if (reward.metric_type === 'weekly_rate') {
    // Average completion rate across all goals over last 7 days
    const last7 = getLastNDates(7)
    if (goals.length === 0) {
      currentValue = 0
    } else {
      const rates = goals.map((g) => {
        const relevant = allCheckIns.filter(
          (c) => c.goal_id === g.id && last7.includes(c.date)
        )
        const completed = relevant.filter((c) => c.status === 'completed').length
        return Math.round((completed / last7.length) * 100)
      })
      currentValue = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
    }
  } else if (reward.metric_type === 'perfect_days') {
    // Count total unique dates where ALL active goals were completed
    const allDates = [...new Set(allCheckIns.map((c) => c.date))]
    let perfectCount = 0
    for (const date of allDates) {
      const dayCheckIns = allCheckIns.filter((c) => c.date === date)
      const allGoalsCompleted =
        goals.length > 0 &&
        goals.every((g) =>
          dayCheckIns.some((c) => c.goal_id === g.id && c.status === 'completed')
        )
      if (allGoalsCompleted) perfectCount++
    }
    currentValue = perfectCount
  } else if (reward.metric_type === 'total_xp') {
    currentValue = xpEntries.reduce((sum, e) => sum + e.amount, 0)
  }

  return {
    currentValue,
    unlocks: currentValue >= reward.target_value,
  }
}

/**
 * Evaluates all rewards and unlocks any whose metric is now met.
 * Returns list of newly unlocked reward IDs (for the caller to show a toast).
 */
export async function _evaluateRewards(): Promise<string[]> {
  const rewards = load<Reward>(KEYS.rewards)
  const newlyUnlocked: string[] = []

  for (const reward of rewards) {
    if (reward.unlocked) continue // already unlocked, skip
    const { unlocks } = await computeRewardProgress(reward)
    if (unlocks) {
      reward.unlocked = true
      reward.unlocked_at = now()
      reward.updated_at = now()
      newlyUnlocked.push(reward.id)
    }
  }

  if (newlyUnlocked.length > 0) {
    save(KEYS.rewards, rewards)
  }

  return newlyUnlocked
}
