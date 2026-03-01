import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import * as syllabusApi from '../../api/syllabus'
import * as coursesApi from '../../api/courses'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI } from '../../utils/constants'

export function SyllabusInputPage() {
  const navigate = useNavigate()
  const { setParsedSyllabus } = useCourseStore()
  const [courseName, setCourseName] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!courseName.trim() || !rawText.trim()) return

    setError('')
    setLoading(true)
    try {
      // Create the course first
      await coursesApi.createCourse(courseName.trim(), courseDescription.trim())
      // Parse syllabus
      const parsed = await syllabusApi.parseSyllabus(rawText)
      setParsedSyllabus(parsed, courseName.trim())
      navigate('/syllabus/review')
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        setError('שם הקורס כבר קיים במערכת')
      } else {
        setError(UI.errorGeneric)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {UI.backToLobby}
        </button>
        <h1 className="text-2xl font-extrabold text-navy-900">{UI.addCourse}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <div className="bg-cream-50 rounded-xl border border-cream-300 p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-navy-700 mb-1.5">{UI.courseName}</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
              placeholder={UI.courseNamePlaceholder}
              className="w-full px-4 py-3 rounded-lg border-2 border-cream-300 bg-cream-100 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-700 mb-1.5">{UI.courseDescription}</label>
            <textarea
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              rows={3}
              placeholder={UI.courseDescriptionPlaceholder}
              className="w-full px-4 py-3 rounded-lg border-2 border-cream-300 bg-cream-100 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm leading-relaxed resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-navy-700 mb-1.5">{UI.syllabusText}</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              required
              rows={14}
              placeholder="הדבק כאן את תוכן הסילבוס..."
              className="w-full px-4 py-3 rounded-lg border-2 border-cream-300 bg-cream-100 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-mono leading-relaxed resize-y"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !courseName.trim() || !rawText.trim()}
          className="w-full py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <LoadingSpinner size="sm" label="מנתח סילבוס... זה יכול לקחת כמה שניות" />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {UI.parseSyllabus}
            </span>
          )}
        </button>
      </form>
    </div>
  )
}
