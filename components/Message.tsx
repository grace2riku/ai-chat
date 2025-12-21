import type { Message as MessageType } from '@/types/chat';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary text-white ml-auto'
            : 'bg-ai-message text-text-primary mr-auto'
        }`}
      >
        <div className="text-sm md:text-base whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}
