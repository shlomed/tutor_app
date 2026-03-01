import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { PhaseIDo } from './PhaseIDo'
import { PhaseWeDo } from './PhaseWeDo'
import { PhaseYouDo } from './PhaseYouDo'
import { UI, previewXp } from '../../utils/constants'

export function LearningPage() {
  const { subtopicId } = useParams<{ subtopicId: string }>()
  const navigate = useNavigate()
  const { currentSubtopicId, currentSubtopicName, learningPhase, hintsUsed } = useCourseStore()

  useEffect(() => {
    // If navigated directly without setting subtopic in store, redirect to lobby
    if (!currentSubtopicId && !currentSubtopicName) {
      navigate('/')
    }
  }, [currentSubtopicId, currentSubtopicName, navigate, subtopicId])

  if (!currentSubtopicId || !currentSubtopicName) {
    return null
  }

  const phaseLabels = [UI.phases.iDo, UI.phases.weDo, UI.phases.youDo]

  return (
    <div className="animate-fade-in">
      {/* Phase progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-navy-500 truncate max-w-[60%]">{currentSubtopicName}</span>
          {learningPhase === 3 && (
            <span className="text-xs font-bold text-amber-400">{UI.expectedXp}: {previewXp(hintsUsed)}</span>
          )}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((phase) => (
            <div
              key={phase}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                phase < learningPhase
                  ? 'bg-emerald-400'
                  : phase === learningPhase
                  ? 'bg-amber-400'
                  : 'bg-cream-300'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {phaseLabels.map((label, i) => (
            <span
              key={i}
              className={`text-[10px] font-medium ${
                i + 1 < learningPhase
                  ? 'text-emerald-400'
                  : i + 1 === learningPhase
                  ? 'text-amber-400'
                  : 'text-navy-400'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {learningPhase === 1 && <PhaseIDo />}
      {learningPhase === 2 && <PhaseWeDo />}
      {learningPhase === 3 && <PhaseYouDo />}
    </div>
  )
}
