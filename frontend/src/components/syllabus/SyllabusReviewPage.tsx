import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import * as syllabusApi from '../../api/syllabus'
import * as coursesApi from '../../api/courses'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI } from '../../utils/constants'

export function SyllabusReviewPage() {
  const navigate = useNavigate()
  const { parsedSyllabus, newCourseName, clearParsedSyllabus } = useCourseStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!parsedSyllabus || !newCourseName) {
    navigate('/syllabus/new')
    return null
  }

  // Flatten for table display
  const rows: { subject: string; topic: string; subtopic: string }[] = []
  let subjectCount = 0, topicCount = 0, subtopicCount = 0
  for (const subject of parsedSyllabus.subjects) {
    subjectCount++
    for (const topic of subject.topics) {
      topicCount++
      for (const st of topic.subtopics) {
        subtopicCount++
        rows.push({ subject: subject.name, topic: topic.name, subtopic: st.name })
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const courses = await coursesApi.getCourses()
      const course = courses.find((c) => c.name === newCourseName)
      if (!course) throw new Error('Course not found')
      await syllabusApi.saveSyllabus(course.id, parsedSyllabus)
      clearParsedSyllabus()
      navigate('/')
    } catch {
      setError(UI.errorGeneric)
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate('/syllabus/new')
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy-900 mb-1">סקירת סילבוס: {newCourseName}</h1>
        <p className="text-sm text-navy-400">
          {UI.total}: {subjectCount} {UI.subject}, {topicCount} {UI.topic}, {subtopicCount} {UI.subtopic}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4 animate-fade-in">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-cream-50 rounded-xl border border-cream-300 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-deep-800 text-navy-800">
                <th className="px-4 py-3 text-right font-bold">{UI.subject}</th>
                <th className="px-4 py-3 text-right font-bold">{UI.topic}</th>
                <th className="px-4 py-3 text-right font-bold">{UI.subtopic}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t border-cream-200 ${i % 2 === 0 ? 'bg-cream-50' : 'bg-cream-100'} hover:bg-amber-500/10 transition-colors`}
                >
                  <td className="px-4 py-2.5 text-navy-700 font-medium">{row.subject}</td>
                  <td className="px-4 py-2.5 text-navy-600">{row.topic}</td>
                  <td className="px-4 py-2.5 text-navy-500">{row.subtopic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {saving ? <LoadingSpinner size="sm" label="שומר..." /> : UI.saveToDB}
        </button>
        <button
          onClick={handleBack}
          className="px-6 py-3.5 rounded-xl font-bold text-sm text-navy-600 bg-cream-200 hover:bg-cream-300 transition-colors"
        >
          {UI.backToEdit}
        </button>
      </div>
    </div>
  )
}
