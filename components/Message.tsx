import { memo } from 'react';
import type { Message as MessageType } from '@/types/chat';

interface MessageProps {
  message: MessageType;
}

function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full mb-4 animate-slide-up ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
      role="article"
      aria-label={isUser ? 'あなたのメッセージ' : 'AIの応答'}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md ${
          isUser
            ? 'bg-primary text-white ml-auto hover:bg-primary-700'
            : 'bg-ai-message-bg text-ai-message-text mr-auto hover:bg-surface-hover'
        }`}
      >
        <div className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}

// メモ化により、propsが変更されない限り再レンダリングを防ぐ
export default memo(Message);
