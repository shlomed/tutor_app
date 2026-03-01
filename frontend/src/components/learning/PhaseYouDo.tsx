import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCourseStore } from '../../stores/courseStore'
import { useChat } from '../../hooks/useChat'
import * as evaluationApi from '../../api/evaluation'
import * as learningApi from '../../api/learning'
import * as progressApi from '../../api/progress'
import type { EvaluationResult } from '../../types/evaluation'
import { ChatWindow } from './ChatWindow'
import { ChatInput } from './ChatInput'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import { UI, previewXp } from '../../utils/constants'

interface QuestionResult {
  questionNumber: number
  isCorrect: boolean
  xpEarned: number
  hintsUsed: number
}

export function PhaseYouDo() {
  const navigate = useNavigate()
  const {
    currentSubtopicId,
    currentSubtopicName,
    hintsUsed,
    incrementHints,
    resetLearningSession,
    setLearningPhase,
  } = useCourseStore()

  const { messages, sendMessage, startConversation, isLoading: chatLoading } = useChat(
    'you-do',
    currentSubtopicId!,
    currentSubtopicName!
  )

  const hasStarted = useRef(false)
  const [finalAnswer, setFinalAnswer] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null)
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1)
  const [currentQuestionHints, setCurrentQuestionHints] = useState(0)
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)

  // Auto-start: AI presents first question on mount
  useEffect(() => {
    if (!hasStarted.current && messages.length === 0) {
      hasStarted.current = true
      startConversation()
    }
  }, [messages.length, startConversation])

  const handleSendHint = async (text: string) => {
    await sendMessage(text)
    setCurrentQuestionHints((prev) => prev + 1)
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
        currentQuestionHints,
        false // don't save per-question; save on finish
      )
      setCurrentResult(res)
      if (res.is_correct) {
        setQuestionResults((prev) => [
          ...prev,
          {
            questionNumber: currentQuestionNumber,
            isCorrect: true,
            xpEarned: res.xp_earned,
            hintsUsed: currentQuestionHints,
          },
        ])
      }
    } catch {
      // ignore
    } finally {
      setEvaluating(false)
    }
  }

  const handleNextQuestion = async () => {
    setCurrentResult(null)
    setFinalAnswer('')
    setCurrentQuestionHints(0)
    setCurrentQuestionNumber((prev) => prev + 1)
    await sendMessage(UI.nextQuestion)
  }

  const handleFinishPractice = async () => {
    const totalXp = questionResults.reduce((sum, r) => sum + r.xpEarned, 0)
    if (totalXp > 0 && currentSubtopicId) {
      setSavingProgress(true)
      try {
        await progressApi.updateProgress(currentSubtopicId, 'completed', totalXp, hintsUsed)
      } catch {
        // ignore
      } finally {
        setSavingProgress(false)
      }
    }
    setShowSummary(true)
  }

  const handleBackToLobby = () => {
    resetLearningSession()
    navigate('/')
  }

  const handleBackToWeDo = async () => {
    if (currentSubtopicId) {
      await learningApi.clearChatHistory(currentSubtopicId)
    }
    setLearningPhase(2)
  }

  // Summary screen
  if (showSummary) {
    const totalXp = questionResults.reduce((sum, r) => sum + r.xpEarned, 0)
    const correctCount = questionResults.filter((r) => r.isCorrect).length

    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-bounce-in">
        <div className="w-full max-w-md rounded-2xl border-2 border-amber-500/30 bg-cream-50 p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-amber-600/15 flex items-center justify-center text-3xl">
            🏆
          </div>
          <h3 className="text-xl font-extrabold text-navy-900 mb-5 text-center">{UI.practiceComplete}</h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-cream-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-navy-800">{questionResults.length}</p>
              <p className="text-xs text-navy-400 mt-1">{UI.questionsAnswered}</p>
            </div>
            <div className="bg-cream-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-400">{correctCount}</p>
              <p className="text-xs text-navy-400 mt-1">{UI.correctAnswers}</p>
            </div>
          </div>

          {totalXp > 0 && (
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-2 bg-amber-600/15 border border-amber-600/25 rounded-full px-5 py-2">
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-extrabold text-amber-400">{UI.gotXp} {totalXp} {UI.xp}!</span>
              </div>
            </div>
          )}

          {questionResults.length > 0 && (
            <div className="space-y-2 mb-6">
              {questionResults.map((r) => (
                <div key={r.questionNumber} className="flex items-center justify-between px-3 py-2 rounded-lg bg-cream-200 text-xs">
                  <span className="text-navy-500">{UI.questionNumber} {r.questionNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span className="font-bold text-amber-400">+{r.xpEarned} {UI.xp}</span>
                    {r.hintsUsed > 0 && (
                      <span className="text-navy-400">({r.hintsUsed} {UI.hintsUsed})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleBackToLobby}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md transition-all"
          >
            {UI.backToLobby}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg">
            ✍️
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">
              שלב 3: {UI.phases.youDo}
            </h2>
            <p className="text-xs text-navy-400">{UI.questionNumber} {currentQuestionNumber}</p>
          </div>
        </div>

        {/* Stats + navigation */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setLearningPhase(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-navy-500 hover:text-navy-800 hover:bg-cream-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {UI.backToExplanation}
          </button>
          <button
            onClick={handleBackToWeDo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-navy-500 hover:text-navy-800 hover:bg-cream-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {UI.backToWeDo}
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-cream-200 border border-cream-300 text-xs font-bold text-navy-600">
            {UI.hintsUsed}: {currentQuestionHints}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-600/10 border border-amber-600/20 text-xs font-bold text-amber-400">
            {UI.expectedXp}: {previewXp(currentQuestionHints)}
          </div>
          {questionResults.length > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
              {UI.totalXpEarned}: {questionResults.reduce((s, r) => s + r.xpEarned, 0)}
            </div>
          )}
          <button
            onClick={handleFinishPractice}
            disabled={savingProgress}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cream-300 text-navy-600 hover:bg-cream-400 border border-cream-400 transition-colors disabled:opacity-50"
          >
            {savingProgress ? <LoadingSpinner size="sm" /> : UI.finishPractice}
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-cream-50 rounded-xl border border-cream-300 overflow-hidden min-h-0 mb-4">
        <ChatWindow messages={messages} isLoading={chatLoading} />
        {!currentResult && (
          <ChatInput onSend={handleSendHint} disabled={chatLoading} />
        )}
      </div>

      {/* Inline result card */}
      {currentResult && (
        <div className={`rounded-xl border-2 p-4 mb-4 ${
          currentResult.is_correct
            ? 'bg-emerald-900/10 border-emerald-500/30'
            : 'bg-red-900/10 border-red-500/30'
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{currentResult.is_correct ? '🎉' : '💪'}</span>
            <div className="flex-1">
              <p className={`font-bold text-sm ${currentResult.is_correct ? 'text-emerald-300' : 'text-red-300'}`}>
                {currentResult.is_correct ? 'תשובה נכונה!' : 'עוד קצת...'}
              </p>
              <p className={`text-xs mt-1 leading-relaxed ${currentResult.is_correct ? 'text-emerald-300/80' : 'text-red-300/80'}`}>
                {currentResult.feedback}
              </p>
            </div>
            {currentResult.is_correct && currentResult.xp_earned > 0 && (
              <div className="shrink-0 px-3 py-1 rounded-full bg-amber-600/15 border border-amber-600/25 text-xs font-bold text-amber-400">
                +{currentResult.xp_earned} {UI.xp}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {currentResult.is_correct ? (
              <button
                onClick={handleNextQuestion}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-l from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all"
              >
                {UI.nextQuestion}
              </button>
            ) : (
              <button
                onClick={() => { setCurrentResult(null); setFinalAnswer('') }}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm text-navy-800 bg-cream-300 hover:bg-cream-400 transition-all"
              >
                {UI.tryAgain}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Final answer form */}
      {!currentResult && (
        <form onSubmit={handleSubmitAnswer} className="bg-cream-200 rounded-xl border-2 border-amber-600/30 p-5">
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
      )}
    </div>
  )
}
