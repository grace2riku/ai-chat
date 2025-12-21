'use client';

import { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { Message, ChatRequest, ChatResponse, ChatError } from '@/types/chat';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (message: string) => {
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
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ヘッダー */}
      <header className="bg-white border-b border-border px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary">AI Chat</h1>
          <p className="text-sm text-text-secondary mt-1">
            カジュアルなAIチャットボット
          </p>
        </div>
      </header>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* メッセージリスト */}
      <MessageList messages={messages} />

      {/* 入力フォーム */}
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
