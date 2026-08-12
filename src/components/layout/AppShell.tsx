import { type ReactNode } from 'react'
import { BottomNav, type Tab } from './BottomNav'
import { TopBar } from './TopBar'
import { usePendingIncidents } from '../../hooks/usePunishments'

interface AppShellProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  title: string
  topBarAction?: ReactNode
  children: ReactNode
}

export function AppShell({
  activeTab,
  onTabChange,
  title,
  topBarAction,
  children,
}: AppShellProps) {
  const { data: incidents = [] } = usePendingIncidents()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Ambient gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <TopBar title={title} action={topBarAction} />

      <main className="flex-1 overflow-y-auto pb-24 relative">
        <div className="max-w-lg mx-auto px-4 py-4">{children}</div>
      </main>

      <BottomNav
        active={activeTab}
        onChange={onTabChange}
        debtCount={incidents.length}
      />
    </div>
  )
}
