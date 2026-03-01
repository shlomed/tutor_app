import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { UI } from '../../utils/constants'

interface Props {
  onClose: () => void
}

export function PreferencesEditor({ onClose }: Props) {
  const { user, updatePreferences } = useAuth()
  const [text, setText] = useState(user?.learning_preferences ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePreferences(text.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // error handled silently
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-deep-800/80 rounded-lg p-3 mx-1 border border-deep-500/30 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-navy-400">{UI.learningPreferences}</span>
        <button
          onClick={onClose}
          className="p-1 rounded text-navy-500 hover:text-navy-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={UI.preferencesPlaceholder}
        className="w-full px-2.5 py-2 rounded-md border border-deep-500/50 bg-deep-900/60 text-navy-200 placeholder-navy-600 text-xs leading-relaxed resize-y focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
      />
      <div className="flex items-center justify-between mt-2">
        {saved && (
          <span className="text-[10px] text-emerald-400 animate-fade-in">{UI.preferencesSaved}</span>
        )}
        {!saved && <span />}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-all"
        >
          {saving ? '...' : 'שמור'}
        </button>
      </div>
    </div>
  )
}
