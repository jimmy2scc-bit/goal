import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  usePunishments,
  useCreatePunishment,
  useUpdatePunishment,
  useDeletePunishment,
  usePunishmentRules,
  useCreateRule,
  useDeleteRule,
  useAllIncidents,
  useMarkIncidentDone,
} from '../hooks/usePunishments'
import {
  useRewardsWithProgress,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
  useClaimReward,
} from '../hooks/useRewards'
import { useGoals } from '../hooks/useGoals'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { PageSpinner } from '../components/ui/Spinner'
import { GoalIconBadge } from '../components/goals/GoalIconBadge'
import { RewardForm } from '../components/rewards/RewardForm'
import { DynamicIcon } from '../components/goals/GoalIconBadge'
import {
  punishmentFormSchema,
  type PunishmentFormValues,
  type Punishment,
  type Reward,
  type RewardFormValues,
} from '../types'
import { Plus, Trash2, Check, Link, Unlink, Gift, Lock, Sparkles, Pencil } from 'lucide-react'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

type PanelTab = 'castigos' | 'premios' | 'deudas'

// ─── Punishment Form ──────────────────────────────────────────────────────────

function PunishmentForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel = 'Guardar',
}: {
  defaultValues?: Partial<PunishmentFormValues>
  onSubmit: (v: PunishmentFormValues) => void | Promise<void>
  loading?: boolean
  submitLabel?: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PunishmentFormValues>({
    resolver: zodResolver(punishmentFormSchema),
    defaultValues: { name: '', description: '', ...defaultValues },
  })

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
      <Input
        id="p-name"
        label="Nombre del castigo"
        placeholder="Ej: 50 flexiones"
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        id="p-desc"
        label="Nota (opcional)"
        placeholder="Descripción o condiciones"
        {...register('description')}
      />
      <Button type="submit" loading={loading} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </form>
  )
}

// ─── Rule Assignment Panel ────────────────────────────────────────────────────

function RulePanel({
  punishment,
  onClose,
}: {
  punishment: Punishment
  onClose: () => void
}) {
  const { data: goals = [] } = useGoals()
  const { data: rules = [] } = usePunishmentRules()
  const createRule = useCreateRule()
  const deleteRule = useDeleteRule()

  const rulesForPunishment = rules.filter((r) => r.punishment_id === punishment.id)
  const linkedGoalIds = new Set(rulesForPunishment.map((r) => r.goal_id))

  const toggle = async (goalId: string) => {
    if (linkedGoalIds.has(goalId)) {
      const rule = rulesForPunishment.find((r) => r.goal_id === goalId)
      if (rule) {
        await deleteRule.mutateAsync(rule.id)
        toast.success('Regla eliminada')
      }
    } else {
      await createRule.mutateAsync({ goalId, punishmentId: punishment.id })
      toast.success('Regla añadida')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        Selecciona las metas que activarán{' '}
        <span className="text-zinc-200 font-semibold">"{punishment.name}"</span> cuando fallen.
      </p>
      {goals.length === 0 ? (
        <p className="text-xs text-zinc-500 text-center py-4">
          Crea metas primero en la pestaña Metas.
        </p>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => {
            const linked = linkedGoalIds.has(goal.id)
            return (
              <button
                key={goal.id}
                onClick={() => void toggle(goal.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  linked
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-zinc-800/40 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                )}
              >
                <GoalIconBadge icon={goal.icon} color={goal.color} size={16} />
                <span className="flex-1 text-sm font-medium">{goal.name}</span>
                {linked ? <Unlink size={14} className="text-red-400" /> : <Link size={14} className="text-zinc-500" />}
              </button>
            )
          })}
        </div>
      )}
      <Button variant="secondary" className="w-full" onClick={onClose}>
        Cerrar
      </Button>
    </div>
  )
}

// ─── Metric label helper ──────────────────────────────────────────────────────

function metricLabel(type: Reward['metric_type'], value: number): string {
  switch (type) {
    case 'streak': return `${value} días de racha`
    case 'weekly_rate': return `${value}% semanal`
    case 'perfect_days': return `${value} días perfectos`
    case 'total_xp': return `${value} XP total`
  }
}

// ─── Rewards Tab ──────────────────────────────────────────────────────────────

function RewardsTab() {
  const [showCreate, setShowCreate] = useState(false)
  const [editReward, setEditReward] = useState<Reward | null>(null)
  const { rewards, progressMap, isLoading } = useRewardsWithProgress()
  const createR = useCreateReward()
  const updateR = useUpdateReward()
  const deleteR = useDeleteReward()
  const claimR = useClaimReward()

  const unclaimedUnlocked = rewards.filter((r) => r.unlocked && !r.claimed)
  const locked = rewards.filter((r) => !r.unlocked)
  const claimed = rewards.filter((r) => r.claimed)

  const handleCreate = async (v: RewardFormValues) => {
    await createR.mutateAsync(v)
    setShowCreate(false)
    toast.success('Premio creado 🎁')
  }

  const handleEdit = async (v: RewardFormValues) => {
    if (!editReward) return
    await updateR.mutateAsync({ id: editReward.id, data: v })
    setEditReward(null)
    toast.success('Premio actualizado')
  }

  const handleDelete = async (r: Reward) => {
    if (!confirm(`¿Eliminar el premio "${r.name}"?`)) return
    await deleteR.mutateAsync(r.id)
    toast.success('Premio eliminado')
  }

  const handleClaim = async (r: Reward) => {
    await claimR.mutateAsync(r.id)
    toast.success(`🎉 ¡Disfrutaste "${r.name}"!`, { duration: 3000 })
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {rewards.length} premio{rewards.length !== 1 ? 's' : ''} definido{rewards.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nuevo premio
        </Button>
      </div>

      {rewards.length === 0 && (
        <Card className="p-8 text-center space-y-3">
          <p className="text-4xl">🎁</p>
          <p className="text-zinc-300 font-medium">Sin premios todavía</p>
          <p className="text-zinc-500 text-sm">
            Crea premios y defíne qué métricas debes alcanzar para ganarlos.
          </p>
          <Button onClick={() => setShowCreate(true)} className="mx-auto">
            <Plus size={14} /> Crear premio
          </Button>
        </Card>
      )}

      {/* Unlocked but not claimed */}
      {unclaimedUnlocked.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Sparkles size={12} /> Desbloqueados ({unclaimedUnlocked.length})
          </h3>
          {unclaimedUnlocked.map((r) => (
            <Card
              key={r.id}
              className="p-4 border-amber-500/30 bg-amber-500/5 relative overflow-hidden"
            >
              {/* glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 pointer-events-none" />
              <div className="flex items-center gap-3 relative">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ring-amber-400/40"
                  style={{ backgroundColor: `${r.color}20` }}
                >
                  <DynamicIcon name={r.icon} size={22} color={r.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-amber-300">{r.name}</p>
                  {r.description && <p className="text-xs text-zinc-400">{r.description}</p>}
                  <Badge variant="warning" className="mt-1">
                    {metricLabel(r.metric_type, r.target_value)} ✅
                  </Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button size="sm" onClick={() => void handleClaim(r)} loading={claimR.isPending}>
                    <Gift size={13} /> Canjear
                  </Button>
                  <button
                    onClick={() => void handleDelete(r)}
                    className="w-full text-center text-xs text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Locked rewards with progress */}
      {locked.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
            <Lock size={12} /> En progreso ({locked.length})
          </h3>
          {locked.map((r) => {
            const progress = progressMap[r.id]
            const pct = progress?.progressPercent ?? 0
            const current = progress?.currentValue ?? 0
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 opacity-60"
                    style={{ backgroundColor: `${r.color}15`, border: `1px solid ${r.color}30` }}
                  >
                    <DynamicIcon name={r.icon} size={20} color={r.color} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-zinc-200">{r.name}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditReward(r)}
                          className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => void handleDelete(r)}
                          className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{metricLabel(r.metric_type, r.target_value)}</span>
                      <span className="font-semibold" style={{ color: r.color }}>
                        {current} / {r.target_value} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: r.color,
                          boxShadow: `0 0 6px ${r.color}60`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Claimed history */}
      {claimed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-zinc-600 uppercase tracking-wider font-semibold">
            Canjeados ({claimed.length})
          </h3>
          {claimed.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 px-4 py-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl opacity-50"
            >
              <DynamicIcon name={r.icon} size={18} color={r.color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-400 truncate">{r.name}</p>
                <p className="text-xs text-zinc-600">{metricLabel(r.metric_type, r.target_value)}</p>
              </div>
              <Badge variant="success">Canjeado ✅</Badge>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo premio">
        <RewardForm onSubmit={handleCreate} loading={createR.isPending} submitLabel="Crear premio" />
      </Modal>

      <Modal open={!!editReward} onClose={() => setEditReward(null)} title="Editar premio">
        {editReward && (
          <RewardForm
            defaultValues={{
              name: editReward.name,
              description: editReward.description ?? '',
              icon: editReward.icon,
              color: editReward.color,
              metric_type: editReward.metric_type,
              target_value: editReward.target_value,
            }}
            onSubmit={handleEdit}
            loading={updateR.isPending}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>
    </div>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PunishmentsScreen() {
  const [tab, setTab] = useState<PanelTab>('castigos')
  const [showCreate, setShowCreate] = useState(false)
  const [editP, setEditP] = useState<Punishment | null>(null)
  const [ruleP, setRuleP] = useState<Punishment | null>(null)

  const { data: punishments = [], isLoading } = usePunishments()
  const { data: incidents = [], isLoading: incLoading } = useAllIncidents()
  const createP = useCreatePunishment()
  const updateP = useUpdatePunishment()
  const deleteP = useDeletePunishment()
  const markDone = useMarkIncidentDone()
  const { data: rules = [] } = usePunishmentRules()
  const { rewards } = useRewardsWithProgress()

  const pendingIncidents = incidents.filter((i) => i.status === 'pending')
  const doneIncidents = incidents.filter((i) => i.status === 'completed')
  const unclaimedRewards = rewards.filter((r) => r.unlocked && !r.claimed).length

  const handleCreate = async (v: PunishmentFormValues) => {
    await createP.mutateAsync(v)
    setShowCreate(false)
    toast.success('Castigo creado')
  }

  const handleEdit = async (v: PunishmentFormValues) => {
    if (!editP) return
    await updateP.mutateAsync({ id: editP.id, data: v })
    setEditP(null)
    toast.success('Castigo actualizado')
  }

  const handleDelete = async (p: Punishment) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return
    await deleteP.mutateAsync(p.id)
    toast.success('Castigo eliminado')
  }

  const handleMarkDone = async (id: string) => {
    await markDone.mutateAsync(id)
    toast.success('Deuda saldada ✅')
  }

  if (isLoading || incLoading) return <PageSpinner />

  const TABS: { id: PanelTab; label: string; badge?: number }[] = [
    { id: 'castigos', label: 'Castigos' },
    { id: 'premios', label: 'Premios', badge: unclaimedRewards },
    { id: 'deudas', label: 'Deudas', badge: pendingIncidents.length },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex bg-zinc-900/60 border border-zinc-800 rounded-xl p-1 gap-1">
        {TABS.map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
              tab === id
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              {label}
              {badge && badge > 0 ? (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-4 h-4 px-0.5 text-white text-[10px] font-bold rounded-full',
                    id === 'premios' ? 'bg-amber-500' : 'bg-red-500'
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {/* ── CASTIGOS TAB ── */}
      {tab === 'castigos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {punishments.length} castigo{punishments.length !== 1 ? 's' : ''} definido{punishments.length !== 1 ? 's' : ''}
            </p>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Nuevo castigo
            </Button>
          </div>

          {punishments.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <p className="text-4xl">💀</p>
              <p className="text-zinc-300 font-medium">Sin castigos</p>
              <p className="text-zinc-500 text-sm">
                Define castigos y asígnalos a metas para que fallen con consecuencias reales.
              </p>
              <Button onClick={() => setShowCreate(true)} className="mx-auto">
                <Plus size={14} /> Crear castigo
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {punishments.map((p) => {
                const linkedCount = rules.filter((r) => r.punishment_id === p.id).length
                return (
                  <Card key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-xl text-lg flex-shrink-0">
                        💀
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-zinc-100">{p.name}</p>
                        {p.description && <p className="text-xs text-zinc-500 mt-0.5">{p.description}</p>}
                        {linkedCount > 0 && (
                          <Badge variant="danger" className="mt-1.5">
                            {linkedCount} meta{linkedCount !== 1 ? 's' : ''} vinculada{linkedCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => setRuleP(p)}>
                        <Link size={12} /> Vincular metas
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditP(p)}>Editar</Button>
                      <Button size="sm" variant="danger" onClick={() => void handleDelete(p)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PREMIOS TAB ── */}
      {tab === 'premios' && <RewardsTab />}

      {/* ── DEUDAS TAB ── */}
      {tab === 'deudas' && (
        <div className="space-y-4">
          {pendingIncidents.length === 0 && doneIncidents.length === 0 ? (
            <Card className="p-8 text-center space-y-2">
              <p className="text-4xl">✅</p>
              <p className="text-zinc-300 font-medium">Sin deudas pendientes</p>
              <p className="text-zinc-500 text-sm">Sigue así — sin fallos, sin consecuencias.</p>
            </Card>
          ) : (
            <>
              {pendingIncidents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Pendientes ({pendingIncidents.length})
                  </h3>
                  {pendingIncidents.map((inc) => (
                    <Card key={inc.id} className="p-4 border-red-500/20 bg-red-500/5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-red-300">
                            {inc.punishment_rule?.punishment?.name ?? 'Castigo'}
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Meta: {inc.punishment_rule?.goal?.name ?? '—'} ·{' '}
                            {new Date(inc.created_at).toLocaleDateString('es')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleMarkDone(inc.id)}
                          loading={markDone.isPending}
                        >
                          <Check size={14} /> Cumplida
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {doneIncidents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Historial ({doneIncidents.length})
                  </h3>
                  {doneIncidents.slice(0, 10).map((inc) => (
                    <div
                      key={inc.id}
                      className="flex items-center gap-3 px-4 py-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl opacity-60"
                    >
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 truncate">
                          {inc.punishment_rule?.punishment?.name ?? 'Castigo'}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {inc.punishment_rule?.goal?.name ?? '—'} ·{' '}
                          {new Date(inc.created_at).toLocaleDateString('es')}
                        </p>
                      </div>
                      <Badge variant="success">Cumplida</Badge>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Punishment modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo castigo">
        <PunishmentForm onSubmit={handleCreate} loading={createP.isPending} submitLabel="Crear castigo" />
      </Modal>

      <Modal open={!!editP} onClose={() => setEditP(null)} title="Editar castigo">
        {editP && (
          <PunishmentForm
            defaultValues={{ name: editP.name, description: editP.description ?? '' }}
            onSubmit={handleEdit}
            loading={updateP.isPending}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>

      <Modal open={!!ruleP} onClose={() => setRuleP(null)} title="Vincular metas">
        {ruleP && <RulePanel punishment={ruleP} onClose={() => setRuleP(null)} />}
      </Modal>
    </div>
  )
}
