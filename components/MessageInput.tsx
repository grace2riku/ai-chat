import { useState, KeyboardEvent, useCallback, memo } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  }, [input, isLoading, onSendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="border-t border-border bg-surface p-4 shadow-md" role="complementary">
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex gap-3 max-w-4xl mx-auto"
        aria-label="メッセージ入力フォーム"
      >
        <label htmlFor="message-input" className="sr-only">
          メッセージを入力
        </label>
        <textarea
          id="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          disabled={isLoading}
          rows={1}
          aria-label="メッセージ入力欄"
          aria-describedby="message-input-help"
          className="flex-1 resize-none rounded-lg border border-border px-4 py-3
                     bg-white
                     transition-all duration-300
                     hover:border-border-hover hover:shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-md
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface"
        />
        <span id="message-input-help" className="sr-only">
          Shift + Enterで改行、Enterで送信
        </span>
        <button
          type="submit"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          aria-label={isLoading ? 'メッセージ送信中' : 'メッセージを送信'}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium
                     shadow-sm
                     transition-all duration-300
                     hover:bg-primary-700 hover:shadow-md hover:scale-105
                     active:scale-95
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              送信中...
            </span>
          ) : (
            '送信'
          )}
        </button>
      </form>
    </div>
  );
}

// メモ化により、propsが変更されない限り再レンダリングを防ぐ
export default memo(MessageInput);
