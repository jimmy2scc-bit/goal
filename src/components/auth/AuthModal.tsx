import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'
import { Smartphone, Laptop, Sparkles } from 'lucide-react'

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Completa tu correo y contraseña')
      return
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('¡Cuenta creada! Has iniciado sesión')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('¡Sesión iniciada! Sincronización activa')
      }

      onClose()
      onSuccess?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}>
      <div className="space-y-4">
        {/* Sync Banner */}
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-400 font-bold text-xs">
            <Laptop size={14} />
            <Sparkles size={12} />
            <Smartphone size={14} />
          </div>
          <p className="text-xs text-zinc-300 font-semibold">Sincronización PC + Celular</p>
          <p className="text-[11px] text-zinc-400">
            Ingresa con la misma cuenta en ambos dispositivos para sincronizar tus metas en vivo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="auth-email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="auth-password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            {mode === 'login'
              ? '¿No tienes cuenta? Regístrate aquí'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
