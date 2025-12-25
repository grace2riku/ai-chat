import { memo } from 'react';
import type { Message as MessageType, TextContent, ImageContent } from '@/types/chat';

interface MessageProps {
  message: MessageType;
}

function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  // コンテンツが文字列の場合と配列の場合で処理を分ける
  const renderContent = () => {
    if (typeof message.content === 'string') {
      return (
        <div className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
      );
    }

    // マルチモーダルコンテンツの場合
    return (
      <div className="flex flex-col gap-2">
        {message.content.map((item, index) => {
          if (item.type === 'text') {
            const textItem = item as TextContent;
            return (
              <div
                key={index}
                className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed"
              >
                {textItem.text}
              </div>
            );
          } else if (item.type === 'image') {
            const imageItem = item as ImageContent;
            return (
              <img
                key={index}
                src={`data:${imageItem.source.media_type};base64,${imageItem.source.data}`}
                alt="添付画像"
                className="max-w-full rounded-lg shadow-sm"
              />
            );
          }
          return null;
        })}
      </div>
    );
  };

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
        {renderContent()}
      </div>
    </div>
  );
}

// メモ化により、propsが変更されない限り再レンダリングを防ぐ
export default memo(Message);
