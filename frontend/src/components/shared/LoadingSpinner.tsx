interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function LoadingSpinner({ size = 'md', label }: Props) {
  const dims = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={`${dims[size]} animate-spin-slow`}>
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
          <circle
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-cream-300"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-amber-500"
          />
        </svg>
      </div>
      {label && (
        <span className="text-sm text-navy-400 font-medium">{label}</span>
      )}
    </div>
  )
}
