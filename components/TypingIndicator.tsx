export default function TypingIndicator() {
  return (
    <div
      className="flex w-full mb-4 justify-start animate-slide-up"
      role="status"
      aria-label="AIが応答を生成しています"
    >
      <div className="max-w-[70%] rounded-lg px-4 py-3 bg-ai-message-bg text-ai-message-text mr-auto shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">AIが入力中</span>
          <div className="flex gap-1" aria-hidden="true">
            <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}
