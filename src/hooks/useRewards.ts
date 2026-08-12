import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  claimReward,
  computeRewardProgress,
  _evaluateRewards,
} from '../api'
import type { RewardFormValues, RewardProgress } from '../types'

export const REWARDS_KEY = ['rewards'] as const

// ─── Query hooks ──────────────────────────────────────────────────────────────

export function useRewards() {
  return useQuery({
    queryKey: REWARDS_KEY,
    queryFn: getRewards,
  })
}

/**
 * Returns live progress for all rewards (including locked ones).
 * Used to render progress bars.
 */
export function useRewardsWithProgress() {
  const { data: rewards = [], ...rest } = useRewards()

  const { data: progressMap = {} } = useQuery({
    queryKey: ['rewardsProgress', rewards.map((r) => r.id).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        rewards.map(async (r) => {
          const { currentValue } = await computeRewardProgress(r)
          const progressPercent = r.metric_type === 'total_xp'
            ? Math.min(100, Math.round((currentValue / r.target_value) * 100))
            : Math.min(100, Math.round((currentValue / r.target_value) * 100))
          return [
            r.id,
            { reward: r, currentValue, targetValue: r.target_value, progressPercent },
          ] as [string, RewardProgress]
        })
      )
      return Object.fromEntries(entries) as Record<string, RewardProgress>
    },
    enabled: rewards.length > 0,
  })

  return { rewards, progressMap, ...rest }
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RewardFormValues) =>
      createReward({
        name: data.name,
        description: data.description ?? null,
        icon: data.icon,
        color: data.color,
        metric_type: data.metric_type,
        target_value: data.target_value,
      }),
    onSuccess: async () => {
      await _evaluateRewards() // Check if new reward is already met
      void qc.invalidateQueries({ queryKey: REWARDS_KEY })
    },
  })
}

export function useUpdateReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RewardFormValues> }) =>
      updateReward(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: REWARDS_KEY }),
  })
}

export function useDeleteReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteReward(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: REWARDS_KEY }),
  })
}

export function useClaimReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => claimReward(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: REWARDS_KEY }),
  })
}
