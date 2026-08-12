import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rewardFormSchema, type RewardFormValues, type RewardMetricType } from '../../types'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { GOAL_ICONS, GOAL_COLORS } from '../goals/goalIcons'
import { DynamicIcon } from '../goals/GoalIconBadge'
import { cn } from '../../lib/utils'

const METRIC_OPTIONS: { value: RewardMetricType; label: string; description: string; unit: string; placeholder: string }[] = [
  {
    value: 'streak',
    label: '🔥 Racha de días',
    description: 'Mantener N días seguidos completando TODAS las metas',
    unit: 'días',
    placeholder: 'Ej: 7',
  },
  {
    value: 'weekly_rate',
    label: '📊 Cumplimiento semanal',
    description: 'Alcanzar X% de cumplimiento promedio en los últimos 7 días',
    unit: '%',
    placeholder: 'Ej: 80',
  },
  {
    value: 'perfect_days',
    label: '🏆 Días perfectos',
    description: 'Acumular N días perfectos (100% de metas completadas)',
    unit: 'días perfectos',
    placeholder: 'Ej: 10',
  },
  {
    value: 'total_xp',
    label: '⚡ XP total',
    description: 'Alcanzar un total acumulado de N puntos de XP',
    unit: 'XP',
    placeholder: 'Ej: 500',
  },
]

interface RewardFormProps {
  defaultValues?: Partial<RewardFormValues>
  onSubmit: (values: RewardFormValues) => void | Promise<void>
  loading?: boolean
  submitLabel?: string
}

export function RewardForm({
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = 'Guardar',
}: RewardFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RewardFormValues>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Trophy',
      color: '#eab308',
      metric_type: 'streak',
      target_value: 7,
      ...defaultValues,
    },
  })

  const selectedIcon = watch('icon')
  const selectedColor = watch('color')
  const selectedMetric = watch('metric_type')
  const metricInfo = METRIC_OPTIONS.find((m) => m.value === selectedMetric)!

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <Input
        id="reward-name"
        label="Nombre del premio"
        placeholder="Ej: Tarde libre, Película, Postre especial"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        id="reward-desc"
        label="Descripción (opcional)"
        placeholder="Cuándo y cómo te lo darás"
        {...register('description')}
      />

      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Color</span>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => field.onChange(c)}
                  className={cn(
                    'w-7 h-7 rounded-full border-2 transition-transform',
                    field.value === c ? 'scale-125 border-white' : 'border-transparent'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Icon picker */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Icono</span>
        <Controller
          name="icon"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-8 gap-1.5">
              {GOAL_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => field.onChange(icon)}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-xl transition-all',
                    field.value === icon
                      ? 'ring-2 ring-offset-1 ring-offset-zinc-900'
                      : 'bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-400'
                  )}
                  style={
                    field.value === icon
                      ? { backgroundColor: `${selectedColor}20`, color: selectedColor }
                      : {}
                  }
                >
                  <DynamicIcon
                    name={icon}
                    size={16}
                    color={field.value === icon ? selectedColor : undefined}
                  />
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Metric type */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Tipo de métrica
        </span>
        <Controller
          name="metric_type"
          control={control}
          render={({ field }) => (
            <div className="space-y-1.5">
              {METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-xl border transition-all text-sm',
                    field.value === opt.value
                      ? 'border-purple-500/50 bg-purple-500/10 text-zinc-100'
                      : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'
                  )}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Target value */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Valor objetivo ({metricInfo.unit})
        </span>
        <input
          type="number"
          min={1}
          max={selectedMetric === 'weekly_rate' ? 100 : 9999}
          placeholder={metricInfo.placeholder}
          className={cn(
            'w-full h-10 px-3 bg-zinc-800/60 border rounded-xl text-sm text-zinc-100',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all',
            errors.target_value ? 'border-red-500' : 'border-zinc-700'
          )}
          {...register('target_value', { valueAsNumber: true })}
        />
        {errors.target_value && (
          <p className="text-xs text-red-400">{errors.target_value.message}</p>
        )}
        <p className="text-xs text-zinc-500">{metricInfo.description}</p>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${selectedColor}20`, border: `1px solid ${selectedColor}40` }}
        >
          <DynamicIcon name={selectedIcon} size={20} color={selectedColor} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-zinc-200 font-medium">{watch('name') || 'Vista previa'}</p>
          <p className="text-xs text-zinc-500">{metricInfo.label} · {watch('target_value')} {metricInfo.unit}</p>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </form>
  )
}
