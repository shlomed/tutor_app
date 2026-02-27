import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types/learning'
import { ChatBubble } from './ChatBubble'

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
}

export function ChatWindow({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-navy-300 text-sm">
          התחל שיחה...
        </div>
      )}

      {messages.map((msg, i) => (
        <ChatBubble key={i} message={msg} />
      ))}

      {isLoading && (
        <div className="flex justify-end animate-fade-in">
          <div className="bg-cream-50 border border-cream-300 rounded-2xl rounded-bl-sm shadow-sm px-5 py-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
