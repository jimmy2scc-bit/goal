import { supabase } from '../../lib/supabaseClient'
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
import { calcStreaks, getLastNDates, getTodayDate, XP_PER_GOAL, XP_PERFECT_DAY } from '../../lib/utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')
  return user.id
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('archived', false)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as Goal[]
}

export async function getAllGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as Goal[]
}

export async function createGoal(
  data: Pick<Goal, 'name' | 'icon' | 'color'>
): Promise<Goal> {
  const userId = await getUserId()
  const goals = await getAllGoals()
  const maxOrder = goals.reduce((m, g) => Math.max(m, g.sort_order), -1)

  const { data: created, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      sort_order: maxOrder + 1,
      archived: false,
    })
    .select()
    .single()

  if (error) throw error
  return created as Goal
}

export async function updateGoal(
  id: string,
  data: Partial<Pick<Goal, 'name' | 'icon' | 'color' | 'sort_order' | 'archived'>>
): Promise<Goal> {
  const { data: updated, error } = await supabase
    .from('goals')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated as Goal
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

export async function reorderGoals(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('goals')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  )
  await Promise.all(updates)
}

// ─── Check-ins ───────────────────────────────────────────────────────────────

export async function getCheckInsForDate(date: string): Promise<CheckIn[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('date', date)

  if (error) throw error
  return data as CheckIn[]
}

export async function getAllCheckIns(): Promise<CheckIn[]> {
  const { data, error } = await supabase.from('check_ins').select('*')
  if (error) throw error
  return data as CheckIn[]
}

export async function upsertCheckIn(
  goalId: string,
  date: string,
  status: CheckInStatus
): Promise<CheckIn> {
  const { data, error } = await supabase
    .from('check_ins')
    .upsert(
      {
        goal_id: goalId,
        date,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'goal_id,date' }
    )
    .select()
    .single()

  if (error) throw error

  if (status === 'failed') {
    await _triggerPunishments(goalId)
  }

  await _handleXPForDate(date)
  await _evaluateRewards()

  return data as CheckIn
}

// ─── XP ──────────────────────────────────────────────────────────────────────

export async function getTotalXP(): Promise<number> {
  const { data, error } = await supabase.from('xp_ledger').select('amount')
  if (error) throw error
  return (data ?? []).reduce((sum, e) => sum + e.amount, 0)
}

export async function getXPEntries(): Promise<XPEntry[]> {
  const { data, error } = await supabase.from('xp_ledger').select('*')
  if (error) throw error
  return data as XPEntry[]
}

export async function addXP(amount: number, reason: string): Promise<XPEntry> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('xp_ledger')
    .insert({ user_id: userId, amount, reason })
    .select()
    .single()

  if (error) throw error
  return data as XPEntry
}

// ─── Punishments ──────────────────────────────────────────────────────────────

export async function getPunishments(): Promise<Punishment[]> {
  const { data, error } = await supabase
    .from('punishments')
    .select('*')
    .eq('archived', false)

  if (error) throw error
  return data as Punishment[]
}

export async function getAllPunishments(): Promise<Punishment[]> {
  const { data, error } = await supabase.from('punishments').select('*')
  if (error) throw error
  return data as Punishment[]
}

export async function createPunishment(
  data: Pick<Punishment, 'name' | 'description'>
): Promise<Punishment> {
  const userId = await getUserId()
  const { data: created, error } = await supabase
    .from('punishments')
    .insert({ user_id: userId, name: data.name, description: data.description })
    .select()
    .single()

  if (error) throw error
  return created as Punishment
}

export async function updatePunishment(
  id: string,
  data: Partial<Pick<Punishment, 'name' | 'description' | 'archived'>>
): Promise<Punishment> {
  const { data: updated, error } = await supabase
    .from('punishments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated as Punishment
}

export async function deletePunishment(id: string): Promise<void> {
  const { error } = await supabase.from('punishments').delete().eq('id', id)
  if (error) throw error
}

// ─── Punishment Rules ─────────────────────────────────────────────────────────

export async function getPunishmentRules(): Promise<PunishmentRule[]> {
  const { data, error } = await supabase
    .from('punishment_rules')
    .select('*, goal:goals(*), punishment:punishments(*)')

  if (error) throw error
  return data as PunishmentRule[]
}

export async function createPunishmentRule(
  goalId: string,
  punishmentId: string
): Promise<PunishmentRule> {
  const { data, error } = await supabase
    .from('punishment_rules')
    .insert({ goal_id: goalId, punishment_id: punishmentId })
    .select('*, goal:goals(*), punishment:punishments(*)')
    .single()

  if (error) throw error
  return data as PunishmentRule
}

export async function deletePunishmentRule(id: string): Promise<void> {
  const { error } = await supabase.from('punishment_rules').delete().eq('id', id)
  if (error) throw error
}

// ─── Punishment Incidents ─────────────────────────────────────────────────────

export async function getIncidents(status?: 'pending' | 'completed'): Promise<PunishmentIncident[]> {
  let query = supabase
    .from('punishment_incidents')
    .select('*, punishment_rule:punishment_rules(*, goal:goals(*), punishment:punishments(*))')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as PunishmentIncident[]
}

export async function markIncidentComplete(id: string): Promise<void> {
  const { error } = await supabase
    .from('punishment_incidents')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

// ─── Rewards ──────────────────────────────────────────────────────────────────

export async function getRewards(): Promise<Reward[]> {
  const { data, error } = await supabase.from('rewards').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data as Reward[]
}

export async function createReward(
  data: Pick<Reward, 'name' | 'description' | 'icon' | 'color' | 'metric_type' | 'target_value'>
): Promise<Reward> {
  const userId = await getUserId()
  const { data: created, error } = await supabase
    .from('rewards')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      metric_type: data.metric_type,
      target_value: data.target_value,
      unlocked: false,
      claimed: false,
    })
    .select()
    .single()

  if (error) throw error
  return created as Reward
}

export async function updateReward(
  id: string,
  data: Partial<Pick<Reward, 'name' | 'description' | 'icon' | 'color' | 'metric_type' | 'target_value'>>
): Promise<Reward> {
  const { data: updated, error } = await supabase
    .from('rewards')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updated as Reward
}

export async function deleteReward(id: string): Promise<void> {
  const { error } = await supabase.from('rewards').delete().eq('id', id)
  if (error) throw error
}

export async function claimReward(id: string): Promise<void> {
  const { error } = await supabase
    .from('rewards')
    .update({ claimed: true, claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function computeRewardProgress(
  reward: Reward
): Promise<{ currentValue: number; unlocks: boolean }> {
  const allCheckIns = await getAllCheckIns()
  const goals = await getGoals()
  const totalXP = await getTotalXP()

  let currentValue = 0

  if (reward.metric_type === 'streak') {
    if (goals.length === 0) {
      currentValue = 0
    } else {
      const streaks = goals.map((g) => {
        const goalCheckIns = allCheckIns.filter((c) => c.goal_id === g.id)
        return calcStreaks(goalCheckIns).current
      })
      currentValue = Math.min(...streaks)
    }
  } else if (reward.metric_type === 'weekly_rate') {
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
    currentValue = totalXP
  }

  return {
    currentValue,
    unlocks: currentValue >= reward.target_value,
  }
}

export async function _evaluateRewards(): Promise<string[]> {
  const rewards = await getRewards()
  const newlyUnlocked: string[] = []

  for (const reward of rewards) {
    if (reward.unlocked) continue
    const { unlocks } = await computeRewardProgress(reward)
    if (unlocks) {
      await supabase
        .from('rewards')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reward.id)
      newlyUnlocked.push(reward.id)
    }
  }

  return newlyUnlocked
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const defaults: UserSettings = {
      user_id: userId,
      day_closing_time: '00:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      display_name: 'Usuario',
    }
    await supabase.from('user_settings').insert(defaults)
    return defaults
  }

  return data as UserSettings
}

export async function updateSettings(
  data: Partial<Omit<UserSettings, 'user_id'>>
): Promise<UserSettings> {
  const userId = await getUserId()
  const { data: updated, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...data, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return updated as UserSettings
}

// ─── Data management ──────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const userId = await getUserId()
  await supabase.from('check_ins').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('goals').delete().eq('user_id', userId)
  await supabase.from('xp_ledger').delete().eq('user_id', userId)
  await supabase.from('punishments').delete().eq('user_id', userId)
  await supabase.from('rewards').delete().eq('user_id', userId)
}

export async function exportData(): Promise<Record<string, unknown>> {
  return {
    goals: await getAllGoals(),
    checkIns: await getAllCheckIns(),
    xp: await getXPEntries(),
    punishments: await getAllPunishments(),
    rules: await getPunishmentRules(),
    incidents: await getIncidents(),
    rewards: await getRewards(),
    settings: await getSettings(),
    exportedAt: new Date().toISOString(),
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function _triggerPunishments(goalId: string): Promise<void> {
  const userId = await getUserId()
  const rules = await getPunishmentRules()
  const goalRules = rules.filter((r) => r.goal_id === goalId)
  if (goalRules.length === 0) return

  const incidents = await getIncidents()
  const today = getTodayDate()

  for (const rule of goalRules) {
    const alreadyToday = incidents.some(
      (i) => i.punishment_rule_id === rule.id && i.created_at.startsWith(today)
    )
    if (alreadyToday) continue
    await supabase.from('punishment_incidents').insert({
      punishment_rule_id: rule.id,
      user_id: userId,
      status: 'pending',
    })
  }
}

async function _handleXPForDate(date: string): Promise<void> {
  const checkIns = await getCheckInsForDate(date)
  const goals = await getGoals()
  const xpEntries = await getXPEntries()

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

  const allCompleted =
    goals.length > 0 &&
    goals.every((g) =>
      checkIns.some((c) => c.goal_id === g.id && c.status === 'completed')
    )

  const perfectAlreadyAwarded = xpEntries.some(
    (e) => e.reason === `perfect:${date}`
  )

  if (allCompleted && !perfectAlreadyAwarded) {
    await addXP(XP_PERFECT_DAY, `perfect:${date}`)
  }
}
