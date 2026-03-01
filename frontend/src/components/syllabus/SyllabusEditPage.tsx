import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as syllabusApi from '../../api/syllabus'
import * as coursesApi from '../../api/courses'
import type { FlatSyllabusRow } from '../../types/course'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI } from '../../utils/constants'

export function SyllabusEditPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const cid = Number(courseId)

  const [tab, setTab] = useState<'edit' | 'reimport'>('edit')
  const [rows, setRows] = useState<FlatSyllabusRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Course name + description state
  const [courseName, setCourseName] = useState('')
  const [originalCourseName, setOriginalCourseName] = useState('')
  const [courseDescription, setCourseDescription] = useState('')
  const [originalCourseDescription, setOriginalCourseDescription] = useState('')
  const [savingCourseInfo, setSavingCourseInfo] = useState(false)

  // Re-import state
  const [reimportText, setReimportText] = useState('')
  const [reimporting, setReimporting] = useState(false)

  // Edits tracking
  const [edits, setEdits] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [cid])

  const loadData = async () => {
    setLoading(true)
    try {
      const [flatData, courses] = await Promise.all([
        syllabusApi.getSyllabusFlat(cid),
        coursesApi.getCourses(),
      ])
      setRows(flatData)
      setEdits({})
      const course = courses.find((c) => c.id === cid)
      if (course) {
        setCourseName(course.name)
        setOriginalCourseName(course.name)
        setCourseDescription(course.description ?? '')
        setOriginalCourseDescription(course.description ?? '')
      }
    } catch {
      setError(UI.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  const loadFlat = async () => {
    setLoading(true)
    try {
      const data = await syllabusApi.getSyllabusFlat(cid)
      setRows(data)
      setEdits({})
    } catch {
      setError(UI.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  const courseInfoChanged = courseName !== originalCourseName || courseDescription !== originalCourseDescription

  const handleSaveCourseInfo = async () => {
    if (!courseName.trim() || !courseInfoChanged) return
    setSavingCourseInfo(true)
    setError('')
    setSuccess('')
    try {
      await coursesApi.updateCourse(cid, courseName.trim(), courseDescription.trim())
      setOriginalCourseName(courseName.trim())
      setOriginalCourseDescription(courseDescription.trim())
      setSuccess('פרטי הקורס עודכנו בהצלחה')
    } catch {
      setError(UI.errorGeneric)
    } finally {
      setSavingCourseInfo(false)
    }
  }

  const handleEdit = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveEdits = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const promises: Promise<void>[] = []
      for (const [key, value] of Object.entries(edits)) {
        const [type, id] = key.split('-')
        const numId = Number(id)
        if (type === 'subject') promises.push(syllabusApi.updateSubjectName(numId, value))
        else if (type === 'topic') promises.push(syllabusApi.updateTopicName(numId, value))
        else if (type === 'subtopic') promises.push(syllabusApi.updateSubtopicName(numId, value))
      }
      await Promise.all(promises)
      setSuccess(`${promises.length} שינויים נשמרו בהצלחה`)
      setEdits({})
      await loadFlat()
    } catch {
      setError(UI.errorGeneric)
    } finally {
      setSaving(false)
    }
  }

  const handleReimport = async () => {
    if (!reimportText.trim()) return
    setReimporting(true)
    setError('')
    try {
      await syllabusApi.reimportSyllabus(cid, reimportText)
      setSuccess('הסילבוס יובא מחדש בהצלחה')
      setReimportText('')
      setTab('edit')
      await loadFlat()
    } catch {
      setError(UI.errorGeneric)
    } finally {
      setReimporting(false)
    }
  }

  const getValue = (key: string, original: string) => {
    return key in edits ? edits[key] : original
  }

  if (loading) return <LoadingSpinner size="lg" label={UI.loading} />

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
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
        <h1 className="text-2xl font-extrabold text-navy-900">עריכת סילבוס</h1>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4 animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-3 text-sm mb-4 animate-fade-in">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-cream-200 rounded-lg p-1">
        <button
          onClick={() => setTab('edit')}
          className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${
            tab === 'edit' ? 'bg-cream-50 text-navy-800 shadow-sm' : 'text-navy-400 hover:text-navy-600'
          }`}
        >
          {UI.inlineEdit}
        </button>
        <button
          onClick={() => setTab('reimport')}
          className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${
            tab === 'reimport' ? 'bg-cream-50 text-navy-800 shadow-sm' : 'text-navy-400 hover:text-navy-600'
          }`}
        >
          {UI.reimport}
        </button>
      </div>

      {tab === 'edit' ? (
        <>
          {/* Course info editing */}
          <div className="bg-cream-50 rounded-xl border border-cream-300 p-4 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">שם הקורס</label>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-cream-300 bg-cream-100 text-navy-800 text-sm font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                data-testid="course-name-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">{UI.courseDescription}</label>
              <textarea
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                rows={3}
                placeholder={UI.courseDescriptionPlaceholder}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-cream-300 bg-cream-100 text-navy-800 placeholder-navy-300 text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-y"
                data-testid="course-description-input"
              />
            </div>

            <button
              onClick={handleSaveCourseInfo}
              disabled={savingCourseInfo || !courseName.trim() || !courseInfoChanged}
              className="px-5 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              data-testid="save-course-name-btn"
            >
              {savingCourseInfo ? '...' : 'שמור פרטי קורס'}
            </button>
          </div>

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
                    <tr key={i} className={`border-t border-cream-200 ${i % 2 === 0 ? 'bg-cream-50' : 'bg-cream-100'}`}>
                      <td className="px-3 py-1.5">
                        <input
                          value={getValue(`subject-${row.subject_id}`, row.subject_name)}
                          onChange={(e) => handleEdit(`subject-${row.subject_id}`, e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-cream-300 bg-cream-100 text-navy-700 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-colors"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          value={getValue(`topic-${row.topic_id}`, row.topic_name)}
                          onChange={(e) => handleEdit(`topic-${row.topic_id}`, e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-cream-300 bg-cream-100 text-navy-600 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-colors"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          value={getValue(`subtopic-${row.subtopic_id}`, row.subtopic_name)}
                          onChange={(e) => handleEdit(`subtopic-${row.subtopic_id}`, e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-cream-300 bg-cream-100 text-navy-500 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-100 transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {Object.keys(edits).length > 0 && (
            <button
              onClick={handleSaveEdits}
              disabled={saving}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? <LoadingSpinner size="sm" label="שומר..." /> : `${UI.saveChanges} (${Object.keys(edits).length})`}
            </button>
          )}
        </>
      ) : (
        <div className="bg-cream-50 rounded-xl border border-cream-300 p-6 space-y-4">
          <div className="bg-amber-600/10 border border-amber-600/20 text-amber-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {UI.reimportWarning}
          </div>

          <textarea
            value={reimportText}
            onChange={(e) => setReimportText(e.target.value)}
            rows={14}
            placeholder="הדבק כאן את תוכן הסילבוס החדש..."
            className="w-full px-4 py-3 rounded-lg border-2 border-cream-300 bg-cream-100 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm font-mono leading-relaxed resize-y"
          />

          <button
            onClick={handleReimport}
            disabled={reimporting || !reimportText.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {reimporting ? <LoadingSpinner size="sm" label="מעבד..." /> : UI.confirmReplace}
          </button>
        </div>
      )}
    </div>
  )
}
