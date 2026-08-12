import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { goalFormSchema, type GoalFormValues } from '../../types'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { GOAL_ICONS, GOAL_COLORS } from './goalIcons'
import { DynamicIcon } from './GoalIconBadge'
import { cn } from '../../lib/utils'

interface GoalFormProps {
  defaultValues?: Partial<GoalFormValues>
  onSubmit: (values: GoalFormValues) => void | Promise<void>
  loading?: boolean
  submitLabel?: string
}

export function GoalForm({
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = 'Guardar',
}: GoalFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      icon: 'Target',
      color: '#8b5cf6',
      ...defaultValues,
    },
  })

  const selectedIcon = watch('icon')
  const selectedColor = watch('color')

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
      <Input
        id="goal-name"
        label="Nombre de la meta"
        placeholder="Ej: Ejercicio diario"
        error={errors.name?.message}
        {...register('name')}
      />

      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Color
        </span>
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
                    field.value === c
                      ? 'scale-125 border-white'
                      : 'border-transparent scale-100'
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
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Icono
        </span>
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

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${selectedColor}20`, border: `1px solid ${selectedColor}40` }}
        >
          <DynamicIcon name={selectedIcon} size={20} color={selectedColor} />
        </div>
        <span className="text-sm text-zinc-300 font-medium">
          {watch('name') || 'Vista previa'}
        </span>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </form>
  )
}
