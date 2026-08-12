import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useReorderGoals } from '../hooks/useGoals'
import { GoalIconBadge } from '../components/goals/GoalIconBadge'
import { GoalForm } from '../components/goals/GoalForm'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'
import type { Goal, GoalFormValues } from '../types'
import { Plus, GripVertical, Pencil, Archive, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'
import toast from 'react-hot-toast'

// ─── Sortable Goal Row ────────────────────────────────────────────────────────

interface SortableGoalProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onArchive: (goal: Goal) => void
  onDelete: (goal: Goal) => void
}

function SortableGoalRow({ goal, onEdit, onArchive, onDelete }: SortableGoalProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: goal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl transition-shadow',
        isDragging && 'shadow-2xl shadow-purple-500/20 border-purple-500/30 bg-zinc-900 z-10 relative'
      )}
    >
      {/* Drag handle */}
      <button
        className="text-zinc-600 hover:text-zinc-400 touch-none cursor-grab active:cursor-grabbing flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>

      <GoalIconBadge icon={goal.icon} color={goal.color} size={18} />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-zinc-100 truncate">{goal.name}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(goal)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onArchive(goal)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
        >
          <Archive size={14} />
        </button>
        <button
          onClick={() => onDelete(goal)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function GoalsScreen() {
  const { data: goals = [], isLoading } = useGoals()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const reorderGoals = useReorderGoals()

  const [showCreate, setShowCreate] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = goals.findIndex((g) => g.id === active.id)
    const newIdx = goals.findIndex((g) => g.id === over.id)
    const reordered = arrayMove(goals, oldIdx, newIdx)
    void reorderGoals.mutateAsync(reordered.map((g) => g.id))
  }

  const handleCreate = async (values: GoalFormValues) => {
    await createGoal.mutateAsync(values)
    setShowCreate(false)
    toast.success('Meta creada ✅')
  }

  const handleEdit = async (values: GoalFormValues) => {
    if (!editGoal) return
    await updateGoal.mutateAsync({ id: editGoal.id, data: values })
    setEditGoal(null)
    toast.success('Meta actualizada')
  }

  const handleArchive = async (goal: Goal) => {
    await updateGoal.mutateAsync({ id: goal.id, data: { archived: true } })
    toast.success('Meta archivada')
  }

  const handleDelete = async (goal: Goal) => {
    if (!confirm(`¿Eliminar "${goal.name}"? Esta acción no se puede deshacer.`)) return
    await deleteGoal.mutateAsync(goal.id)
    toast.success('Meta eliminada')
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Mis Metas</h2>
          <p className="text-xs text-zinc-500">
            {goals.length} meta{goals.length !== 1 ? 's' : ''} activa{goals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus size={16} />
          Nueva meta
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <p className="text-4xl">🎯</p>
          <p className="text-zinc-300 font-medium">Sin metas todavía</p>
          <p className="text-zinc-500 text-sm">
            Crea tu primera meta diaria y empieza a construir disciplina.
          </p>
          <Button onClick={() => setShowCreate(true)} className="mx-auto">
            <Plus size={16} /> Crear meta
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={goals.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {goals.map((goal) => (
                <SortableGoalRow
                  key={goal.id}
                  goal={goal}
                  onEdit={setEditGoal}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-xs text-zinc-600 text-center">
        Arrastra para reordenar · Los días sellados no se pueden modificar
      </p>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva meta">
        <GoalForm
          onSubmit={handleCreate}
          loading={createGoal.isPending}
          submitLabel="Crear meta"
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editGoal}
        onClose={() => setEditGoal(null)}
        title="Editar meta"
      >
        {editGoal && (
          <GoalForm
            defaultValues={{
              name: editGoal.name,
              icon: editGoal.icon,
              color: editGoal.color,
            }}
            onSubmit={handleEdit}
            loading={updateGoal.isPending}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>
    </div>
  )
}
