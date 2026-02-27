import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCourses } from '../../hooks/useCourses'
import { useProgress } from '../../hooks/useProgress'
import { useCourseStore } from '../../stores/courseStore'
import { CourseCard } from './CourseCard'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI } from '../../utils/constants'

export function LobbyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { courses, loading, error } = useCourses()
  const { selectedCourseId } = useCourseStore()
  const { dashboard } = useProgress()

  return (
    <div className="animate-fade-in">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-navy-900 mb-1">
          {UI.welcome}, {user?.name}!
        </h1>
        <p className="text-navy-400 font-medium">{UI.welcomeBack}</p>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="lg" label={UI.loading} />
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Course grid */}
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
              {courses.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  dashboard={dashboard}
                  isSelected={selectedCourseId === course.id}
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-cream-200 flex items-center justify-center">
                <svg className="w-10 h-10 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-navy-700 mb-2">אין קורסים עדיין</h3>
              <p className="text-sm text-navy-400 mb-6">צור את הקורס הראשון שלך כדי להתחיל ללמוד</p>
            </div>
          )}

          {/* Add course button */}
          <button
            onClick={() => navigate('/syllabus/new')}
            className="group flex items-center gap-3 px-6 py-4 rounded-xl border-2 border-dashed border-cream-400 hover:border-amber-400 bg-cream-50/50 hover:bg-amber-50/50 transition-all duration-300 w-full md:w-auto"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-bold text-navy-600 group-hover:text-navy-800 transition-colors">{UI.addCourse}</span>
          </button>
        </>
      )}
    </div>
  )
}
