import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { UI } from '../../utils/constants'

export function AuthPage() {
  const { user, login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [successMsg, setSuccessMsg] = useState('')

  if (user) return <Navigate to="/" replace />

  const handleRegisterSuccess = () => {
    setSuccessMsg(UI.registeredSuccess)
    setTab('login')
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-800/5 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-amber-600/5 blur-2xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-600 shadow-xl shadow-amber-600/20 mb-4">
            <span className="text-white font-extrabold text-2xl">מ</span>
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 mb-1">{UI.appName}</h1>
          <p className="text-navy-400 text-sm font-medium">{UI.appSubtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-cream-50 rounded-2xl shadow-xl shadow-black/20 border border-cream-300/60 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-cream-300/60">
            <button
              onClick={() => { setTab('login'); setSuccessMsg(''); }}
              className={`flex-1 py-3.5 text-sm font-bold transition-all duration-200 relative
                ${tab === 'login'
                  ? 'text-navy-800'
                  : 'text-navy-400 hover:text-navy-600'}`}
            >
              {UI.login}
              {tab === 'login' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-amber-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => { setTab('register'); setSuccessMsg(''); }}
              className={`flex-1 py-3.5 text-sm font-bold transition-all duration-200 relative
                ${tab === 'register'
                  ? 'text-navy-800'
                  : 'text-navy-400 hover:text-navy-600'}`}
            >
              {UI.signup}
              {tab === 'register' && (
                <div className="absolute bottom-0 left-1/4 right-1/4 h-[3px] bg-amber-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Form body */}
          <div className="p-7">
            {successMsg && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-3 text-sm mb-5 animate-bounce-in">
                {successMsg}
              </div>
            )}

            {tab === 'login' ? (
              <LoginForm onLogin={login} />
            ) : (
              <RegisterForm onRegister={register} onSuccess={handleRegisterSuccess} />
            )}
          </div>
        </div>

        {/* Decorative footer line */}
        <div className="flex items-center justify-center mt-6 gap-3">
          <div className="h-px w-12 bg-gradient-to-l from-cream-400 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
          <div className="h-px w-12 bg-gradient-to-r from-cream-400 to-transparent" />
        </div>
      </div>
    </div>
  )
}
