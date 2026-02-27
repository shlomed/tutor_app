import type { LearningPhase } from '../../types/learning'
import { UI } from '../../utils/constants'

interface Props {
  currentPhase: LearningPhase
}

const phases = [
  { num: 1 as const, label: UI.phases.iDo, icon: '📖' },
  { num: 2 as const, label: UI.phases.weDo, icon: '🤝' },
  { num: 3 as const, label: UI.phases.youDo, icon: '✍️' },
]

export function PhaseIndicator({ currentPhase }: Props) {
  return (
    <div className="space-y-1">
      {phases.map((phase, i) => {
        const isActive = phase.num === currentPhase
        const isDone = phase.num < currentPhase

        return (
          <div key={phase.num} className="flex items-center gap-2.5">
            {/* Step circle */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
              ${isDone
                ? 'bg-emerald-500/20 text-emerald-400'
                : isActive
                  ? 'bg-amber-400 text-white shadow-md shadow-amber-500/30'
                  : 'bg-deep-600/50 text-navy-400'}`}
            >
              {isDone ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : phase.num}
            </div>

            {/* Label */}
            <span className={`text-xs font-medium transition-colors ${
              isActive ? 'text-amber-300' : isDone ? 'text-emerald-400' : 'text-navy-400'
            }`}>
              {phase.label}
            </span>

            {/* Connector line */}
            {i < phases.length - 1 && (
              <div className="sr-only" />
            )}
          </div>
        )
      })}
    </div>
  )
}
