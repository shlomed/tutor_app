import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { PhaseIDo } from './PhaseIDo'
import { PhaseWeDo } from './PhaseWeDo'
import { PhaseYouDo } from './PhaseYouDo'

export function LearningPage() {
  const { subtopicId } = useParams<{ subtopicId: string }>()
  const navigate = useNavigate()
  const { currentSubtopicId, currentSubtopicName, learningPhase } = useCourseStore()

  useEffect(() => {
    // If navigated directly without setting subtopic in store, redirect to lobby
    if (!currentSubtopicId && !currentSubtopicName) {
      navigate('/')
    }
  }, [currentSubtopicId, currentSubtopicName, navigate, subtopicId])

  if (!currentSubtopicId || !currentSubtopicName) {
    return null
  }

  return (
    <div className="animate-fade-in">
      {learningPhase === 1 && <PhaseIDo />}
      {learningPhase === 2 && <PhaseWeDo />}
      {learningPhase === 3 && <PhaseYouDo />}
    </div>
  )
}
