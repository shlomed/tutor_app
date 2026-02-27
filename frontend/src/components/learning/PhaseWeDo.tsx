import { useCourseStore } from '../../stores/courseStore'
import { useChat } from '../../hooks/useChat'
import * as learningApi from '../../api/learning'
import { ChatWindow } from './ChatWindow'
import { ChatInput } from './ChatInput'
import { UI } from '../../utils/constants'

export function PhaseWeDo() {
  const { currentSubtopicId, currentSubtopicName, setLearningPhase } = useCourseStore()
  const { messages, sendMessage, isLoading } = useChat(
    'we-do',
    currentSubtopicId!,
    currentSubtopicName!
  )

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-deep-700 to-deep-800 flex items-center justify-center text-lg shadow-md">
            🤝
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-navy-900">
              שלב 2: {UI.phases.weDo}
            </h2>
            <p className="text-xs text-navy-400">{UI.weDoCaption}</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-cream-50 rounded-xl border border-cream-300 overflow-hidden min-h-0">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm text-navy-700 bg-cream-200 hover:bg-cream-300 border border-cream-400 transition-all duration-200 flex items-center justify-center gap-2"
      >
        {UI.weDoButton}
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  )
}
