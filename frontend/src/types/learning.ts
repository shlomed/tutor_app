export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type LearningPhase = 1 | 2 | 3;
