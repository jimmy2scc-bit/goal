import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPunishments,
  createPunishment,
  updatePunishment,
  deletePunishment,
  getPunishmentRules,
  createPunishmentRule,
  deletePunishmentRule,
  getIncidents,
  markIncidentComplete,
} from '../api'
import type { PunishmentFormValues } from '../types'

export const PUNISHMENTS_KEY = ['punishments'] as const
export const RULES_KEY = ['punishmentRules'] as const
export const INCIDENTS_KEY = (status?: string) =>
  status ? (['incidents', status] as const) : (['incidents'] as const)

// ─── Punishments ──────────────────────────────────────────────────────────────

export function usePunishments() {
  return useQuery({ queryKey: PUNISHMENTS_KEY, queryFn: getPunishments })
}

export function useCreatePunishment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PunishmentFormValues) =>
      createPunishment({ name: data.name, description: data.description ?? null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PUNISHMENTS_KEY }),
  })
}

export function useUpdatePunishment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Partial<PunishmentFormValues & { archived: boolean }>
    }) => updatePunishment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PUNISHMENTS_KEY }),
  })
}

export function useDeletePunishment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePunishment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PUNISHMENTS_KEY })
      void qc.invalidateQueries({ queryKey: RULES_KEY })
    },
  })
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export function usePunishmentRules() {
  return useQuery({ queryKey: RULES_KEY, queryFn: getPunishmentRules })
}

export function useCreateRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      goalId,
      punishmentId,
    }: {
      goalId: string
      punishmentId: string
    }) => createPunishmentRule(goalId, punishmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  })
}

export function useDeleteRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePunishmentRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: RULES_KEY }),
  })
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export function usePendingIncidents() {
  return useQuery({
    queryKey: INCIDENTS_KEY('pending'),
    queryFn: () => getIncidents('pending'),
  })
}

export function useAllIncidents() {
  return useQuery({
    queryKey: INCIDENTS_KEY(),
    queryFn: () => getIncidents(),
  })
}

export function useMarkIncidentDone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markIncidentComplete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INCIDENTS_KEY() })
      void qc.invalidateQueries({ queryKey: INCIDENTS_KEY('pending') })
    },
  })
}
