import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSyllabus } from '../../hooks/useSyllabus'
import { useProgress } from '../../hooks/useProgress'
import { useCourseStore } from '../../stores/courseStore'
import type { ProgressStatus } from '../../types/progress'
import { LoadingSpinner } from '../shared/LoadingSpinner'

interface Props {
  courseId: number
  onNavigate: () => void
}

function StatusDot({ status }: { status: ProgressStatus }) {
  if (status === 'completed') {
    return (
      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
        <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (status === 'in_progress') {
    return <div className="w-3 h-3 rounded-full border-2 border-amber-400 bg-amber-400/20 shrink-0" />
  }
  return <div className="w-3 h-3 rounded-full border-2 border-deep-500 bg-transparent shrink-0" />
}

export function SyllabusTree({ courseId, onNavigate }: Props) {
  const { tree, loading } = useSyllabus(courseId)
  const { dashboard } = useProgress(courseId)
  const { setCurrentSubtopic } = useCourseStore()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (loading) return <LoadingSpinner size="sm" />
  if (!tree.length) return null

  const getStatus = (subtopicId: number): ProgressStatus => {
    const detail = dashboard?.details?.find((d) => d.subtopic_id === subtopicId)
    return detail?.status || 'not_started'
  }

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubtopicClick = (subtopicId: number, subtopicName: string) => {
    setCurrentSubtopic(subtopicId, subtopicName)
    navigate(`/learn/${subtopicId}`)
    onNavigate()
  }

  return (
    <div className="space-y-1 px-1">
      {tree.map((subject) => (
        <div key={subject.id}>
          <button
            onClick={() => toggleExpand(`s-${subject.id}`)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold text-navy-300 hover:text-cream-100 hover:bg-deep-600/30 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${expanded[`s-${subject.id}`] ? 'rotate-90' : 'rotate-0'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{subject.name}</span>
          </button>

          {expanded[`s-${subject.id}`] && (
            <div className="mr-4 space-y-0.5">
              {subject.topics.map((topic) => (
                <div key={topic.id}>
                  <button
                    onClick={() => toggleExpand(`t-${topic.id}`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-navy-400 hover:text-cream-200 hover:bg-deep-600/20 transition-colors"
                  >
                    <svg
                      className={`w-2.5 h-2.5 transition-transform duration-200 ${expanded[`t-${topic.id}`] ? 'rotate-90' : 'rotate-0'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{topic.name}</span>
                  </button>

                  {expanded[`t-${topic.id}`] && (
                    <div className="mr-4 space-y-0.5">
                      {topic.subtopics.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => handleSubtopicClick(st.id, st.name)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-navy-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                        >
                          <StatusDot status={getStatus(st.id)} />
                          <span className="truncate">{st.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
