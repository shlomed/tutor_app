import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types/learning';
import * as learningApi from '../api/learning';

export function useChat(
  phase: 'we-do' | 'you-do',
  subtopicId: number,
  subtopicName: string
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setIsLoading(true);
      try {
        const sender = phase === 'we-do' ? learningApi.sendWeDoMessage : learningApi.sendYouDoMessage;
        const response = await sender(text, subtopicId, subtopicName);
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      } catch {
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [phase, subtopicId, subtopicName]
  );

  const startConversation = useCallback(
    async () => {
      setIsLoading(true);
      try {
        const sender = phase === 'we-do' ? learningApi.sendWeDoMessage : learningApi.sendYouDoMessage;
        const response = await sender('בואו נתחיל!', subtopicId, subtopicName);
        setMessages([{ role: 'assistant', content: response }]);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    },
    [phase, subtopicId, subtopicName]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, sendMessage, startConversation, isLoading, clearMessages };
}
