import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSyllabus } from '../../hooks/useSyllabus'
import { useProgress } from '../../hooks/useProgress'
import { useCourseStore } from '../../stores/courseStore'
import { ProgressBar } from '../shared/ProgressBar'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI } from '../../utils/constants'
import type { ProgressStatus } from '../../types/progress'
import * as coursesApi from '../../api/courses'

function StatusDot({ status }: { status: ProgressStatus }) {
  if (status === 'completed') {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
        <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (status === 'in_progress') {
    return <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-400/20 shrink-0" />
  }
  return <div className="w-4 h-4 rounded-full border-2 border-navy-400 bg-transparent shrink-0" />
}

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const numericCourseId = courseId ? Number(courseId) : null
  const navigate = useNavigate()
  const { selectedCourseName, setSelectedCourse, setCurrentSubtopic } = useCourseStore()
  const { tree, loading: treeLoading } = useSyllabus(numericCourseId)
  const { dashboard } = useProgress(numericCourseId ?? undefined)
  const [courseName, setCourseName] = useState<string | null>(selectedCourseName)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!numericCourseId) {
      navigate('/')
      return
    }
    // If we have the name in store, use it; otherwise fetch from API
    if (!courseName) {
      coursesApi.getCourses().then((courses) => {
        const found = courses.find((c) => c.id === numericCourseId)
        if (found) {
          setCourseName(found.name)
          setSelectedCourse(found.id, found.name)
        } else {
          navigate('/')
        }
      }).catch(() => navigate('/'))
    }
  }, [numericCourseId, courseName, navigate, setSelectedCourse])

  const getStatus = (subtopicId: number): ProgressStatus =>
    dashboard?.details?.find((d) => d.subtopic_id === subtopicId)?.status || 'not_started'

  const getXp = (subtopicId: number): number =>
    dashboard?.details?.find((d) => d.subtopic_id === subtopicId)?.xp_earned ?? 0

  const toggleExpand = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleSubtopicClick = (subtopicId: number, subtopicName: string) => {
    setCurrentSubtopic(subtopicId, subtopicName)
    navigate(`/learn/${subtopicId}`)
  }

  const totalXp = dashboard?.details?.reduce((sum, d) => sum + d.xp_earned, 0) ?? 0

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-medium text-navy-500 hover:text-navy-800 mb-3 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {UI.backToLobby}
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600/15 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-navy-900">{courseName || '...'}</h1>
              {dashboard && (
                <p className="text-sm text-navy-400 mt-0.5">
                  {dashboard.completed_subtopics}/{dashboard.total_subtopics} {UI.completed}
                </p>
              )}
            </div>
          </div>

          {totalXp > 0 && (
            <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-600/10 border border-amber-600/20">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold text-amber-400">{totalXp} {UI.xp}</span>
            </div>
          )}
        </div>

        {dashboard && (
          <div className="mt-4">
            <ProgressBar value={dashboard.completed_subtopics} max={dashboard.total_subtopics} />
          </div>
        )}
      </div>

      {/* Syllabus tree */}
      {treeLoading ? (
        <LoadingSpinner size="lg" label={UI.loading} />
      ) : tree.length === 0 ? (
        <div className="text-center py-12 text-navy-400 text-sm">אין תוכן בקורס זה עדיין</div>
      ) : (
        <div className="space-y-3">
          {tree.map((subject) => (
            <div key={subject.id} className="bg-cream-50 rounded-xl border border-cream-300 overflow-hidden">
              {/* Subject header */}
              <button
                onClick={() => toggleExpand(`s-${subject.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-right hover:bg-cream-100 transition-colors"
              >
                <svg
                  className={`w-4 h-4 text-navy-400 transition-transform duration-200 shrink-0 ${expanded[`s-${subject.id}`] ? 'rotate-90' : 'rotate-0'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="flex-1 font-bold text-navy-800 text-sm text-right">{subject.name}</span>
                <span className="text-xs text-navy-400 shrink-0">
                  {subject.topics.reduce((sum, t) => sum + t.subtopics.length, 0)} {UI.subtopic}
                </span>
              </button>

              {expanded[`s-${subject.id}`] && (
                <div className="border-t border-cream-300">
                  {subject.topics.map((topic) => (
                    <div key={topic.id}>
                      {/* Topic row */}
                      <button
                        onClick={() => toggleExpand(`t-${topic.id}`)}
                        className="w-full flex items-center gap-3 px-6 py-2.5 text-right hover:bg-cream-100 transition-colors bg-cream-50/50"
                      >
                        <svg
                          className={`w-3.5 h-3.5 text-navy-400 transition-transform duration-200 shrink-0 ${expanded[`t-${topic.id}`] ? 'rotate-90' : 'rotate-0'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="flex-1 text-sm text-navy-600 text-right">{topic.name}</span>
                        <span className="text-xs text-navy-400 shrink-0">{topic.subtopics.length}</span>
                      </button>

                      {expanded[`t-${topic.id}`] && (
                        <div className="border-t border-cream-200">
                          {topic.subtopics.map((st) => (
                            <button
                              key={st.id}
                              onClick={() => handleSubtopicClick(st.id, st.name)}
                              className="w-full flex items-center gap-3 px-8 py-3 text-right hover:bg-amber-500/5 hover:border-r-2 hover:border-amber-400 transition-all group"
                            >
                              <StatusDot status={getStatus(st.id)} />
                              <span className="flex-1 text-sm text-navy-500 group-hover:text-navy-800 text-right transition-colors">{st.name}</span>
                              {getXp(st.id) > 0 && (
                                <span className="shrink-0 text-xs font-bold text-amber-400 bg-amber-600/10 px-2 py-0.5 rounded-full">
                                  {getXp(st.id)} XP
                                </span>
                              )}
                              <svg className="w-4 h-4 text-navy-300 group-hover:text-amber-400 shrink-0 transition-colors rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
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
      )}
    </div>
  )
}
