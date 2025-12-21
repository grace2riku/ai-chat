import { useEffect, useRef } from 'react';
import Message from './Message';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            チャットを始めましょう
          </h2>
          <p className="text-text-secondary">
            メッセージを入力して、AIとの会話を楽しんでください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
