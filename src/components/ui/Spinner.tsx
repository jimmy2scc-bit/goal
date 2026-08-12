export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-zinc-700 border-t-purple-500 rounded-full animate-spin"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <Spinner size={32} />
    </div>
  )
}
