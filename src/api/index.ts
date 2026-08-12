import * as localAdapter from './adapters/local'
import * as supabaseAdapter from './adapters/supabase'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

let isUserLoggedIn = false

// Monitor auth status
if (isSupabaseConfigured()) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    isUserLoggedIn = !!session
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    isUserLoggedIn = !!session
  })
}

function getActiveAdapter() {
  if (isSupabaseConfigured() && isUserLoggedIn) {
    return supabaseAdapter
  }
  return localAdapter
}

// ─── Exported Domain API ──────────────────────────────────────────────────────

export const getGoals: typeof localAdapter.getGoals = (...args) => getActiveAdapter().getGoals(...args)
export const getAllGoals: typeof localAdapter.getAllGoals = (...args) => getActiveAdapter().getAllGoals(...args)
export const createGoal: typeof localAdapter.createGoal = (...args) => getActiveAdapter().createGoal(...args)
export const updateGoal: typeof localAdapter.updateGoal = (...args) => getActiveAdapter().updateGoal(...args)
export const deleteGoal: typeof localAdapter.deleteGoal = (...args) => getActiveAdapter().deleteGoal(...args)
export const reorderGoals: typeof localAdapter.reorderGoals = (...args) => getActiveAdapter().reorderGoals(...args)

export const getCheckInsForDate: typeof localAdapter.getCheckInsForDate = (...args) => getActiveAdapter().getCheckInsForDate(...args)
export const getAllCheckIns: typeof localAdapter.getAllCheckIns = (...args) => getActiveAdapter().getAllCheckIns(...args)
export const upsertCheckIn: typeof localAdapter.upsertCheckIn = (...args) => getActiveAdapter().upsertCheckIn(...args)

export const getTotalXP: typeof localAdapter.getTotalXP = (...args) => getActiveAdapter().getTotalXP(...args)
export const getXPEntries: typeof localAdapter.getXPEntries = (...args) => getActiveAdapter().getXPEntries(...args)
export const addXP: typeof localAdapter.addXP = (...args) => getActiveAdapter().addXP(...args)

export const getPunishments: typeof localAdapter.getPunishments = (...args) => getActiveAdapter().getPunishments(...args)
export const getAllPunishments: typeof localAdapter.getAllPunishments = (...args) => getActiveAdapter().getAllPunishments(...args)
export const createPunishment: typeof localAdapter.createPunishment = (...args) => getActiveAdapter().createPunishment(...args)
export const updatePunishment: typeof localAdapter.updatePunishment = (...args) => getActiveAdapter().updatePunishment(...args)
export const deletePunishment: typeof localAdapter.deletePunishment = (...args) => getActiveAdapter().deletePunishment(...args)

export const getPunishmentRules: typeof localAdapter.getPunishmentRules = (...args) => getActiveAdapter().getPunishmentRules(...args)
export const createPunishmentRule: typeof localAdapter.createPunishmentRule = (...args) => getActiveAdapter().createPunishmentRule(...args)
export const deletePunishmentRule: typeof localAdapter.deletePunishmentRule = (...args) => getActiveAdapter().deletePunishmentRule(...args)

export const getIncidents: typeof localAdapter.getIncidents = (...args) => getActiveAdapter().getIncidents(...args)
export const markIncidentComplete: typeof localAdapter.markIncidentComplete = (...args) => getActiveAdapter().markIncidentComplete(...args)

export const getRewards: typeof localAdapter.getRewards = (...args) => getActiveAdapter().getRewards(...args)
export const createReward: typeof localAdapter.createReward = (...args) => getActiveAdapter().createReward(...args)
export const updateReward: typeof localAdapter.updateReward = (...args) => getActiveAdapter().updateReward(...args)
export const deleteReward: typeof localAdapter.deleteReward = (...args) => getActiveAdapter().deleteReward(...args)
export const claimReward: typeof localAdapter.claimReward = (...args) => getActiveAdapter().claimReward(...args)
export const computeRewardProgress: typeof localAdapter.computeRewardProgress = (...args) => getActiveAdapter().computeRewardProgress(...args)
export const _evaluateRewards: typeof localAdapter._evaluateRewards = (...args) => getActiveAdapter()._evaluateRewards(...args)

export const getSettings: typeof localAdapter.getSettings = (...args) => getActiveAdapter().getSettings(...args)
export const updateSettings: typeof localAdapter.updateSettings = (...args) => getActiveAdapter().updateSettings(...args)
export const clearAllData: typeof localAdapter.clearAllData = (...args) => getActiveAdapter().clearAllData(...args)
export const exportData: typeof localAdapter.exportData = (...args) => getActiveAdapter().exportData(...args)
