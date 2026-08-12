import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getSettings, updateSettings, clearAllData, exportData } from '../api'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { AuthModal } from '../components/auth/AuthModal'
import type { UserSettings } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Download, Trash2, Shield, Clock, User, Globe, RefreshCw, LogIn, LogOut, Laptop, Smartphone } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function SettingsScreen() {
  const qc = useQueryClient()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { register, handleSubmit, reset } = useForm<Omit<UserSettings, 'user_id'>>()

  useEffect(() => {
    void getSettings().then((s) => {
      setSettings(s)
      reset(s)
    })

    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user))
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUser(session?.user ?? null)
        void qc.invalidateQueries()
      })
      return () => subscription.unsubscribe()
    }
  }, [reset, qc])

  const onSave = async (data: Omit<UserSettings, 'user_id'>) => {
    await updateSettings(data)
    toast.success('Ajustes guardados')
    void qc.invalidateQueries()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setAuthUser(null)
    toast.success('Sesión cerrada')
    void qc.invalidateQueries()
  }

  const handleExport = async () => {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `disciplineos-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Datos exportados')
  }

  const handleClear = async () => {
    if (!confirm('⚠️ ¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return
    await clearAllData()
    void qc.invalidateQueries()
    reset({ day_closing_time: '00:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, display_name: 'Usuario' })
    toast.success('Datos borrados')
  }

  if (!settings) return null

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-zinc-100">Ajustes</h2>

      {/* Account & Sync Card */}
      <Card className="p-4 space-y-3 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-purple-400 uppercase tracking-wider font-bold">
            <RefreshCw size={14} className="animate-spin-slow" /> Sincronización Multi-Dispositivo
          </div>
          {authUser ? (
            <Badge variant="success">Conectado 🟢</Badge>
          ) : (
            <Badge variant="warning">Modo Local ⚪</Badge>
          )}
        </div>

        {authUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 font-medium">Cuenta activa (PC + Celular)</p>
                <p className="text-sm font-semibold text-zinc-100 truncate">{authUser.email}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Tus metas y check-ins se están sincronizando en tiempo real entre tu PC y tu Celular.
            </p>
            <Button variant="secondary" onClick={() => void handleLogout()} className="w-full" size="sm">
              <LogOut size={14} /> Cerrar sesión
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-1 text-purple-400">
                <Laptop size={14} /> ↔ <Smartphone size={14} />
              </div>
              <span>Conecta tus dispositivos iniciando sesión con la misma cuenta.</span>
            </div>
            <Button onClick={() => setShowAuthModal(true)} className="w-full" size="md">
              <LogIn size={15} /> Iniciar Sesión / Registrarse
            </Button>
          </div>
        )}
      </Card>

      <form onSubmit={(e) => void handleSubmit(onSave)(e)} className="space-y-4">
        {/* Profile */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            <User size={13} /> Perfil
          </div>
          <Input
            id="display-name"
            label="Nombre"
            placeholder="Tu nombre"
            {...register('display_name')}
          />
        </Card>

        {/* Day settings */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            <Clock size={13} /> Cierre de día
          </div>
          <Input
            id="closing-time"
            label="Hora de cierre (local)"
            type="time"
            {...register('day_closing_time')}
          />
          <p className="text-xs text-zinc-500">
            Los pendientes se convertirán en fallos a esta hora. Por defecto: 00:00.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Globe size={12} />
            <span>Zona horaria: <span className="text-zinc-300">{settings.timezone}</span></span>
          </div>
        </Card>

        <Button type="submit" className="w-full" size="lg">
          Guardar ajustes
        </Button>
      </form>

      {/* About */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider font-semibold">
          <Shield size={13} /> Acerca de
        </div>
        <div className="space-y-1 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-200 font-semibold">DisciplineOS</span> — Fase 1 MVP
          </p>
          <p className="text-xs text-zinc-600">
            Sincronización en tiempo real basada en Supabase PostgreSQL + Auth RLS.
          </p>
        </div>
      </Card>

      {/* Data management */}
      <Card className="p-4 space-y-3">
        <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Datos</p>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => void handleExport()} className="w-full">
            <Download size={15} /> Exportar datos (JSON)
          </Button>
          <Button variant="danger" onClick={() => void handleClear()} className="w-full">
            <Trash2 size={15} /> Borrar todos los datos
          </Button>
        </div>
      </Card>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
