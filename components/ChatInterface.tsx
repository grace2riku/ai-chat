'use client';

import { useState, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Message, ChatRequest, ChatResponse, ChatError } from '@/types/chat';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = useCallback(async (message: string) => {
    // ユーザーメッセージを追加
    const userMessage: Message = {
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // APIにリクエストを送信
      const requestBody: ChatRequest = {
        message,
        conversationHistory: messages,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: ChatError = await response.json();
        throw new Error(errorData.error || 'エラーが発生しました');
      }

      const data: ChatResponse = await response.json();

      // AI応答を追加
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);

      // エラーメッセージを表示
      const errorMessageObj: Message = {
        role: 'assistant',
        content: `エラー: ${errorMessage}`,
      };

      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ヘッダー */}
      <header className="bg-white border-b border-border px-4 py-4 shadow-sm animate-slide-down" role="banner">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            AI Chat
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            カジュアルなAIチャットボット
          </p>
        </div>
      </header>

      {/* エラー表示 */}
      {error && (
        <div
          className="bg-red-50 border-l-4 border-error p-4 mx-4 mt-4 rounded-r-lg shadow-sm animate-slide-down"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-error flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-red-700 flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* メッセージリスト */}
      <main className="flex-1 overflow-hidden" role="main">
        <MessageList messages={messages} isLoading={isLoading} />
      </main>

      {/* 入力フォーム */}
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
