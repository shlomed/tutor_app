import { useNavigate } from 'react-router-dom'
import type { Course } from '../../types/course'
import type { Dashboard } from '../../types/progress'
import { ProgressBar } from '../shared/ProgressBar'
import { useCourseStore } from '../../stores/courseStore'
import { UI } from '../../utils/constants'

interface Props {
  course: Course
  dashboard: Dashboard | null
  isSelected: boolean
  style?: React.CSSProperties
}

export function CourseCard({ course, dashboard, isSelected, style }: Props) {
  const navigate = useNavigate()
  const { setSelectedCourse, openSidebar } = useCourseStore()

  const totalXp = dashboard?.details?.reduce((sum, d) => sum + d.xp_earned, 0) ?? 0

  const handleSelect = () => {
    setSelectedCourse(course.id, course.name)
    openSidebar()
  }

  return (
    <div
      style={style}
      className={`
        group relative bg-cream-50 rounded-xl border-2 transition-all duration-300
        hover:shadow-lg hover:shadow-amber-500/8 hover:-translate-y-0.5
        ${isSelected
          ? 'border-amber-400 shadow-md shadow-amber-500/10'
          : 'border-cream-300 hover:border-amber-300'}
      `}
    >
      {/* Gold accent strip */}
      <div className={`absolute top-0 right-0 left-0 h-1 rounded-t-xl transition-all duration-300
        ${isSelected
          ? 'bg-gradient-to-l from-amber-400 to-amber-600'
          : 'bg-cream-300 group-hover:bg-amber-400/50'}`}
      />

      <div className="p-5 pt-6">
        {/* Course name */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-deep-800 flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-navy-800 text-base leading-snug truncate">{course.name}</h3>
            {dashboard && (
              <p className="text-xs text-navy-400 mt-0.5">
                {dashboard.completed_subtopics}/{dashboard.total_subtopics} {UI.completed}
              </p>
            )}
          </div>
        </div>

        {/* Progress */}
        {dashboard && (
          <div className="mb-4">
            <ProgressBar value={dashboard.completed_subtopics} max={dashboard.total_subtopics} />
          </div>
        )}

        {/* XP badge */}
        {totalXp > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold text-amber-700">{totalXp} {UI.xp}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSelect}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
              ${isSelected
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-500/10 text-navy-700 hover:bg-amber-600 hover:text-white'}`}
          >
            {UI.selectCourse}
          </button>
          <button
            onClick={() => navigate(`/syllabus/edit/${course.id}`)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-navy-400 hover:text-navy-700 hover:bg-cream-200 transition-all duration-200 border border-cream-300"
          >
            {UI.editCourse}
          </button>
        </div>
      </div>
    </div>
  )
}
