import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { useChat } from '../../hooks/useChat'
import * as evaluationApi from '../../api/evaluation'
import type { EvaluationResult } from '../../types/evaluation'
import { ChatWindow } from './ChatWindow'
import { ChatInput } from './ChatInput'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI, previewXp } from '../../utils/constants'

export function PhaseYouDo() {
  const navigate = useNavigate()
  const {
    currentSubtopicId,
    currentSubtopicName,
    hintsUsed,
    incrementHints,
    resetLearningSession,
  } = useCourseStore()

  const { messages, sendMessage, isLoading: chatLoading } = useChat(
    'you-do',
    currentSubtopicId!,
    currentSubtopicName!
  )

  const [finalAnswer, setFinalAnswer] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState<EvaluationResult | null>(null)

  const handleSendHint = async (text: string) => {
    await sendMessage(text)
    incrementHints()
  }

  const handleSubmitAnswer = async (e: FormEvent) => {
    e.preventDefault()
    if (!finalAnswer.trim()) return

    setEvaluating(true)
    try {
      const res = await evaluationApi.evaluateAnswer(
        finalAnswer.trim(),
        currentSubtopicName!,
        currentSubtopicId!,
        hintsUsed
      )
      setResult(res)
    } catch {
      // keep evaluating false
    } finally {
      setEvaluating(false)
    }
  }

  const handleBackToLobby = () => {
    resetLearningSession()
    navigate('/')
  }

  // Show evaluation result
  if (result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-bounce-in">
        <div className={`w-full max-w-md rounded-2xl border-2 p-8 text-center shadow-xl ${
          result.is_correct
            ? 'bg-emerald-900/20 border-emerald-500/30'
            : 'bg-red-900/20 border-red-500/30'
        }`}>
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
            result.is_correct
              ? 'bg-emerald-900/30'
              : 'bg-red-900/30'
          }`}>
            {result.is_correct ? '🎉' : '💪'}
          </div>

          {/* Feedback */}
          <h3 className={`text-xl font-extrabold mb-3 ${result.is_correct ? 'text-emerald-300' : 'text-red-300'}`}>
            {result.is_correct ? 'תשובה נכונה!' : 'עוד קצת...'}
          </h3>
          <p className={`text-sm mb-5 leading-relaxed ${result.is_correct ? 'text-emerald-300' : 'text-red-300'}`}>
            {result.feedback}
          </p>

          {result.is_correct && result.xp_earned > 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300/30 rounded-full px-5 py-2 mb-5">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-extrabold text-amber-300">{UI.gotXp} {result.xp_earned} {UI.xp}!</span>
            </div>
          )}

          {/* Actions */}
          {result.is_correct ? (
            <button
              onClick={handleBackToLobby}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md transition-all"
            >
              {UI.backToLobby}
            </button>
          ) : (
            <button
              onClick={() => { setResult(null); setFinalAnswer(''); }}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-navy-800 bg-cream-200 hover:bg-cream-300 transition-all"
            >
              {UI.tryAgain}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-lg shadow-md">
            ✍️
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">
              שלב 3: {UI.phases.youDo}
            </h2>
            <p className="text-xs text-navy-400">{UI.youDoCaption}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-cream-200 border border-cream-300 text-xs font-bold text-navy-600">
            {UI.hintsUsed}: {hintsUsed}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">
            {UI.expectedXp}: {previewXp(hintsUsed)}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-cream-50 rounded-xl border border-cream-300 overflow-hidden min-h-0 mb-4">
        <ChatWindow messages={messages} isLoading={chatLoading} />
        <ChatInput onSend={handleSendHint} disabled={chatLoading} />
      </div>

      {/* Final answer form */}
      <form onSubmit={handleSubmitAnswer} className="bg-cream-50 rounded-xl border-2 border-amber-300 p-5">
        <label className="block text-sm font-bold text-navy-700 mb-2">{UI.finalAnswer}</label>
        <textarea
          value={finalAnswer}
          onChange={(e) => setFinalAnswer(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border-2 border-cream-300 bg-cream-100 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm resize-y mb-3"
          style={{ direction: 'rtl', textAlign: 'right' }}
          placeholder="כתוב כאן את התשובה הסופית שלך..."
        />
        <button
          type="submit"
          disabled={evaluating || !finalAnswer.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {evaluating ? (
            <LoadingSpinner size="sm" label="בודק תשובה..." />
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {UI.submitAnswer}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
