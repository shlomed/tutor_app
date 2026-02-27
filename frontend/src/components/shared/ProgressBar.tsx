interface Props {
  value: number
  max: number
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, max, showLabel = true, className = '' }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
          <span className="text-navy-500">{value}/{max}</span>
          <span className="text-amber-600 font-bold">{pct}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-deep-600 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #6D28D9, #8B5CF6, #A78BFA)',
          }}
        />
      </div>
    </div>
  )
}
