import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { UI } from '../../utils/constants'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-cream-300 bg-cream-50 p-3">
      <div className="flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={UI.typeMessage}
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-cream-300 bg-cream-100 text-navy-800 placeholder-navy-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-sm resize-none min-h-[42px] max-h-32"
          style={{ direction: 'rtl', textAlign: 'right' }}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-deep-800 hover:bg-deep-700 text-amber-400 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  )
}
