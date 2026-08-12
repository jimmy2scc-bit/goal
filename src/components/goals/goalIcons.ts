// Curated set of 24 Lucide icon names for goals
export const GOAL_ICONS = [
  'Dumbbell', 'BookOpen', 'Brain', 'Heart', 'Moon', 'Sun',
  'Droplets', 'Apple', 'Bike', 'Music', 'Code', 'Pen',
  'Coffee', 'Flame', 'Star', 'Trophy', 'Zap', 'Target',
  'Clock', 'Leaf', 'Smile', 'Shield', 'Globe', 'Camera',
] as const

export type GoalIconName = typeof GOAL_ICONS[number]

export const GOAL_COLORS = [
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#a855f7', // violet
  '#f43f5e', // rose
]
