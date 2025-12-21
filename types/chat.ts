// チャット関連の型定義

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory: Message[];
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

export interface ChatError {
  error: string;
  statusCode: number;
}
