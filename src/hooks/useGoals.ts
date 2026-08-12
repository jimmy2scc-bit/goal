import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  reorderGoals,
} from '../api'
import type { GoalFormValues } from '../types'

export const GOALS_KEY = ['goals'] as const

export function useGoals() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: getGoals,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GoalFormValues) => createGoal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<GoalFormValues & { archived: boolean; sort_order: number }>
    }) => updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useReorderGoals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderGoals(orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}
