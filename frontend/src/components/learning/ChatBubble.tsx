import type { ChatMessage } from '../../types/learning'
import { MarkdownRenderer } from '../shared/MarkdownRenderer'

interface Props {
  message: ChatMessage
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} animate-fade-in`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-deep-800 text-navy-800 rounded-br-sm'
          : 'bg-cream-50 border border-cream-300 text-navy-800 rounded-bl-sm shadow-sm'
      }`}>
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  )
}
