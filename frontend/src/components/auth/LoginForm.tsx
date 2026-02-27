import { useState, type FormEvent } from 'react'
import { UI } from '../../utils/constants'

interface Props {
  onLogin: (username: string, password: string) => Promise<void>
}

export function LoginForm({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(username, password)
    } catch {
      setError('שם משתמש או סיסמה שגויים')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-navy-700 mb-1.5">{UI.username}</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border-2 border-cream-300 bg-cream-50 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm"
          placeholder="your_username"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy-700 mb-1.5">{UI.password}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border-2 border-cream-300 bg-cream-50 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-lg font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            {UI.loading}
          </span>
        ) : UI.loginBtn}
      </button>
    </form>
  )
}
