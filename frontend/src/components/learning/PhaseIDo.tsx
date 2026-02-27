import { useState, useEffect } from 'react'
import { useCourseStore } from '../../stores/courseStore'
import * as learningApi from '../../api/learning'
import * as progressApi from '../../api/progress'
import { MarkdownRenderer } from '../shared/MarkdownRenderer'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI } from '../../utils/constants'

export function PhaseIDo() {
  const {
    currentSubtopicId,
    currentSubtopicName,
    iDoContent,
    setIDoContent,
    setLearningPhase,
  } = useCourseStore()
  const [loading, setLoading] = useState(!iDoContent)

  useEffect(() => {
    if (!iDoContent && currentSubtopicName) {
      setLoading(true)
      learningApi
        .getIDoContent(currentSubtopicName)
        .then(setIDoContent)
        .finally(() => setLoading(false))
    }
  }, [currentSubtopicName, iDoContent, setIDoContent])

  const handleNext = async () => {
    if (currentSubtopicId) {
      await progressApi.updateProgress(currentSubtopicId, 'in_progress')
      await learningApi.clearChatHistory(currentSubtopicId)
    }
    setLearningPhase(2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" label="מכין שיעור..." />
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg shadow-md shadow-amber-500/20">
          📖
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-navy-900">
            שלב 1: {UI.phases.iDo}
          </h2>
          <p className="text-sm text-navy-400">{currentSubtopicName}</p>
        </div>
      </div>

      {/* Lesson content */}
      <div className="bg-cream-50 rounded-xl border border-cream-300 p-6 lg:p-8 mb-6 shadow-sm">
        {iDoContent && <MarkdownRenderer content={iDoContent} />}
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {UI.iDoButton}
        <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  )
}
