import { useState } from 'react'
import { useGlobalMonthlyCalendar, type GlobalDayData } from '../../hooks/useStats'
import { Card } from '../ui/Card'
import { PageSpinner } from '../ui/Spinner'
import { cn } from '../../lib/utils'
import { ChevronLeft, ChevronRight, Trophy, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react'

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function GlobalCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<GlobalDayData | null>(null)

  const { daysMap, dates, isLoading } = useGlobalMonthlyCalendar(year, month)

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
    setSelectedDay(null)
  }

  const firstDow = new Date(year, month - 1, 1).getDay() // 0 = Sun

  if (isLoading) return <PageSpinner />

  return (
    <Card className="p-4 space-y-4">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
          {MONTH_NAMES[month - 1]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-800">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          Perfecto
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Parcial
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Fallado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
          Sin datos
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
          <div key={d} className="text-center text-[10px] text-zinc-500 font-semibold uppercase">
            {d}
          </div>
        ))}

        {/* Empty padding cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {dates.map((date) => {
          const dayData = daysMap[date]
          const isSelected = selectedDay?.date === date
          const dayNum = parseInt(date.split('-')[2], 10)

          return (
            <button
              key={date}
              onClick={() => setSelectedDay(dayData)}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-150',
                dayData.status === 'perfect' && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30',
                dayData.status === 'partial' && 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30',
                dayData.status === 'failed' && 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30',
                dayData.status === 'empty' && 'bg-zinc-800/40 text-zinc-500 hover:bg-zinc-800 border border-transparent',
                isSelected && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 scale-105 z-10'
              )}
            >
              <span className="text-xs font-bold">{dayNum}</span>
              {dayData.status === 'perfect' && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-1" />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day detail popover */}
      {selectedDay && (
        <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60 animate-fadeIn space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200">
              {new Date(selectedDay.date + 'T00:00').toLocaleDateString('es', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
            <span className="text-zinc-400">
              {selectedDay.completedCount} / {selectedDay.totalGoals} completadas
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {selectedDay.status === 'perfect' && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Trophy size={14} /> ¡Día perfecto alcanzado!
              </span>
            )}
            {selectedDay.status === 'partial' && (
              <span className="flex items-center gap-1 text-amber-400">
                <CheckCircle2 size={14} /> Progreso parcial ({selectedDay.completedCount} completadas)
              </span>
            )}
            {selectedDay.status === 'failed' && (
              <span className="flex items-center gap-1 text-red-400 font-semibold">
                <AlertTriangle size={14} /> Se registraron fallos este día
              </span>
            )}
            {selectedDay.status === 'empty' && (
              <span className="flex items-center gap-1 text-zinc-500">
                <MinusCircle size={14} /> Sin actividad registrada
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
