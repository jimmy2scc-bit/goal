import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCheckInsForDate, upsertCheckIn } from '../api'
import { REWARDS_KEY } from './useRewards'
import type { CheckInStatus } from '../types'
import toast from 'react-hot-toast'

export const CHECK_INS_KEY = (date: string) => ['checkIns', date] as const

export function useCheckIns(date: string) {
  return useQuery({
    queryKey: CHECK_INS_KEY(date),
    queryFn: () => getCheckInsForDate(date),
  })
}

export function useUpsertCheckIn(date: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      goalId,
      status,
    }: {
      goalId: string
      status: CheckInStatus
    }) => upsertCheckIn(goalId, date, status),
    onSuccess: async (_result, _vars, _ctx) => {
      void qc.invalidateQueries({ queryKey: CHECK_INS_KEY(date) })
      void qc.invalidateQueries({ queryKey: ['xp'] })
      void qc.invalidateQueries({ queryKey: ['incidents'] })

      // Check if any reward was newly unlocked (adapter returns updated data)
      // We re-fetch rewards and compare against previous state
      const prevRewards = qc.getQueryData<Awaited<ReturnType<typeof import('../api').getRewards>>>(REWARDS_KEY)
      const wasUnlocked = new Set((prevRewards ?? []).filter((r) => r.unlocked).map((r) => r.id))

      await qc.invalidateQueries({ queryKey: REWARDS_KEY })
      const newRewards = await qc.fetchQuery({ queryKey: REWARDS_KEY, queryFn: () => import('../api').then((m) => m.getRewards()) })
      const freshUnlocked = newRewards.filter((r) => r.unlocked && !wasUnlocked.has(r.id))

      for (const reward of freshUnlocked) {
        toast.success(
          `🎁 ¡Premio desbloqueado! "${reward.name}"`,
          { duration: 4000, style: { background: '#18181b', color: '#fbbf24', border: '1px solid #92400e' } }
        )
      }
    },
  })
}
