import { useEffect, useRef } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 animate-fade-in" role="status">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 animate-scale-in" aria-hidden="true">💬</div>
          <h2 className="text-2xl font-bold text-text-primary mb-3 animate-slide-up">
            チャットを始めましょう
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed animate-slide-up">
            メッセージを入力して、AIとの会話を楽しんでください
          </p>
          <div className="mt-8 p-4 bg-surface rounded-lg border border-border animate-slide-up" role="note">
            <p className="text-sm text-text-tertiary">
              <span aria-hidden="true">💡</span> <span className="font-medium">Tip:</span> Shift + Enter で改行できます
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-4 scroll-smooth"
      role="log"
      aria-label="会話履歴"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
    </div>
  );
}
