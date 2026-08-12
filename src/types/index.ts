// ─── Domain Types ────────────────────────────────────────────────────────────

export type CheckInStatus = 'completed' | 'failed' | 'pending'

export interface Goal {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  sort_order: number
  archived: boolean
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  goal_id: string
  date: string // ISO date YYYY-MM-DD
  status: CheckInStatus
  created_at: string
  updated_at: string
}

export interface XPEntry {
  id: string
  user_id: string
  amount: number
  reason: string
  created_at: string
}

export interface Punishment {
  id: string
  user_id: string
  name: string
  description: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface PunishmentRule {
  id: string
  goal_id: string
  punishment_id: string
  created_at: string
  updated_at: string
  // joined
  goal?: Goal
  punishment?: Punishment
}

export interface PunishmentIncident {
  id: string
  punishment_rule_id: string
  user_id: string
  status: 'pending' | 'completed'
  created_at: string
  updated_at: string
  // joined
  punishment_rule?: PunishmentRule
}

export type RewardMetricType =
  | 'streak'          // Racha de N días seguidos
  | 'weekly_rate'     // % cumplimiento en últimos 7 días
  | 'perfect_days'    // N días perfectos
  | 'total_xp'        // N XP acumulados

export interface Reward {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  metric_type: RewardMetricType
  target_value: number
  unlocked: boolean
  unlocked_at: string | null
  claimed: boolean
  claimed_at: string | null
  created_at: string
  updated_at: string
}

export interface UserSettings {
  user_id: string
  day_closing_time: string // HH:MM
  timezone: string
  display_name: string
}

// ─── View / Computed Types ───────────────────────────────────────────────────

export interface GoalWithCheckIn extends Goal {
  checkIn?: CheckIn
}

export interface GoalStats {
  goal_id: string
  current_streak: number
  best_streak: number
  completion_rate_7d: number
  completion_rate_30d: number
}

export interface XPLevel {
  level: number
  title: string
  totalXP: number
  xpForNextLevel: number
  xpInCurrentLevel: number
  progressPercent: number
}

export interface RewardProgress {
  reward: Reward
  currentValue: number
  targetValue: number
  progressPercent: number
}

// ─── Form Schemas (Zod) ──────────────────────────────────────────────────────

import { z } from 'zod'

export const goalFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(60),
  icon: z.string().min(1),
  color: z.string().min(1),
})
export type GoalFormValues = z.infer<typeof goalFormSchema>

export const punishmentFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(80),
  description: z.string().max(300).optional(),
})
export type PunishmentFormValues = z.infer<typeof punishmentFormSchema>

export const rewardFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(80),
  description: z.string().max(300).optional(),
  icon: z.string().min(1),
  color: z.string().min(1),
  metric_type: z.enum(['streak', 'weekly_rate', 'perfect_days', 'total_xp']),
  target_value: z.number({ message: 'Debe ser un número válido' }).min(1, 'El valor objetivo debe ser al menos 1'),
})
export type RewardFormValues = z.infer<typeof rewardFormSchema>
