import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { type Tab } from './components/layout/BottomNav'
import { TodayScreen } from './screens/TodayScreen'
import { GoalsScreen } from './screens/GoalsScreen'
import { PunishmentsScreen } from './screens/PunishmentsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'

const TAB_TITLES: Record<Tab, string> = {
  today: 'Vista de Hoy',
  goals: 'Mis Metas',
  punishments: 'Castigos',
  stats: 'Estadísticas',
  settings: 'Ajustes',
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('today')

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={TAB_TITLES[activeTab]}
    >
      {activeTab === 'today' && <TodayScreen />}
      {activeTab === 'goals' && <GoalsScreen />}
      {activeTab === 'punishments' && <PunishmentsScreen />}
      {activeTab === 'stats' && <StatsScreen />}
      {activeTab === 'settings' && <SettingsScreen />}
    </AppShell>
  )
}
