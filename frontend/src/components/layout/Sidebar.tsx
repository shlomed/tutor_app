import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCourseStore } from '../../stores/courseStore'
import { SyllabusTree } from '../lobby/SyllabusTree'
import { PreferencesEditor } from '../settings/PreferencesEditor'
import { UI } from '../../utils/constants'

interface Props {
  onClose: () => void
}

export function Sidebar({ onClose }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { selectedCourseName, selectedCourseId } = useCourseStore()
  const [showPreferences, setShowPreferences] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const handleNav = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="h-full flex flex-col bg-deep-900 text-navy-700 overflow-hidden border-l border-deep-600/50">
      {/* Header */}
      <div className="p-5 border-b border-deep-600/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-amber-600/20">
            מ
          </div>
          <div>
            <h2 className="font-bold text-navy-900 text-base leading-tight">{UI.appName}</h2>
            <p className="text-[11px] text-navy-300 leading-tight">{UI.appSubtitle}</p>
          </div>
        </div>

        {/* User info */}
        <div className="flex items-center gap-2.5 bg-deep-600/40 rounded-lg px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
            {user?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-navy-800 truncate">{user?.name}</p>
          </div>
          <button
            onClick={() => setShowPreferences((v) => !v)}
            title={UI.learningPreferences}
            className={`shrink-0 p-1.5 rounded-md transition-colors ${showPreferences ? 'text-amber-400 bg-amber-500/10' : 'text-navy-400 hover:text-amber-400 hover:bg-amber-500/10'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            title={UI.logout}
            className="shrink-0 p-1.5 rounded-md text-navy-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {showPreferences && (
          <div className="mt-3">
            <PreferencesEditor onClose={() => setShowPreferences(false)} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {/* Lobby */}
        <button
          onClick={() => handleNav('/')}
          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mb-1
            ${location.pathname === '/' ? 'bg-amber-600/15 text-amber-400' : 'text-navy-500 hover:bg-deep-600/40 hover:text-navy-800'}`}
        >
          <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
          </svg>
          {UI.backToLobby}
        </button>

        {/* Selected course */}
        {selectedCourseName && (
          <div className="mt-4 mb-2">
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] uppercase tracking-wider text-navy-500 font-semibold">קורס נבחר</span>
            </div>
            <div className="bg-deep-600/30 rounded-lg px-3 py-2 mx-1 border border-deep-500/30">
              <p className="text-sm font-semibold text-amber-400 leading-snug">{selectedCourseName}</p>
            </div>

            {/* Syllabus tree */}
            {selectedCourseId && (
              <div className="mt-3">
                <SyllabusTree courseId={selectedCourseId} onNavigate={onClose} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-deep-600/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {UI.logout}
        </button>
      </div>
    </div>
  )
}
