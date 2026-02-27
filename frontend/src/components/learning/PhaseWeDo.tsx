import { useEffect, useRef } from 'react'
import { useCourseStore } from '../../stores/courseStore'
import { useChat } from '../../hooks/useChat'
import * as learningApi from '../../api/learning'
import { ChatWindow } from './ChatWindow'
import { ChatInput } from './ChatInput'
import { UI } from '../../utils/constants'

export function PhaseWeDo() {
  const { currentSubtopicId, currentSubtopicName, setLearningPhase } = useCourseStore()
  const { messages, sendMessage, startConversation, isLoading } = useChat(
    'we-do',
    currentSubtopicId!,
    currentSubtopicName!
  )
  const hasStarted = useRef(false)

  // Auto-start the conversation so the LLM presents a problem first
  useEffect(() => {
    if (!hasStarted.current && messages.length === 0) {
      hasStarted.current = true
      startConversation()
    }
  }, [messages.length, startConversation])

  const handleNext = async () => {
    if (currentSubtopicId) {
      await learningApi.clearChatHistory(currentSubtopicId)
    }
    setLearningPhase(3)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/15 flex items-center justify-center text-lg">
            🤝
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">
              שלב 2: {UI.phases.weDo}
            </h2>
            <p className="text-xs text-navy-400">{UI.weDoCaption}</p>
          </div>
        </div>

        {/* Back to explanation */}
        <button
          onClick={() => setLearningPhase(1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-navy-500 hover:text-navy-800 hover:bg-cream-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {UI.backToExplanation}
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-cream-50 rounded-xl border border-cream-300 overflow-hidden min-h-0">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm text-navy-800 bg-cream-300 hover:bg-cream-400 border border-cream-400 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {UI.weDoButton}
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  )
}
