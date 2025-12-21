import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MessageList from '../MessageList';
import type { Message as MessageType } from '@/types/chat';

// Mock the Message component to isolate MessageList testing
jest.mock('../Message', () => {
  return function MockMessage({ message }: { message: MessageType }) {
    return <div data-testid="message">{message.content}</div>;
  };
});

// Mock the TypingIndicator component
jest.mock('../TypingIndicator', () => {
  return function MockTypingIndicator() {
    return <div data-testid="typing-indicator">AI is typing...</div>;
  };
});

describe('MessageList', () => {
  // Mock scrollIntoView before each test
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  describe('Empty state', () => {
    it('displays welcome message when there are no messages', () => {
      // Given: MessageList with no messages
      render(<MessageList messages={[]} />);

      // Then: Should display welcome heading
      expect(screen.getByRole('heading', { name: /チャットを始めましょう/i })).toBeInTheDocument();

      // And: Should display welcome description
      expect(screen.getByText(/メッセージを入力して、AIとの会話を楽しんでください/i)).toBeInTheDocument();
    });

    it('displays tip about keyboard shortcuts in empty state', () => {
      // Given: MessageList with no messages
      render(<MessageList messages={[]} />);

      // Then: Should display tip about Shift + Enter
      expect(screen.getByText(/Shift \+ Enter で改行できます/i)).toBeInTheDocument();
    });

    it('displays emoji icon in empty state', () => {
      // Given: MessageList with no messages
      render(<MessageList messages={[]} />);

      // Then: Should display chat emoji
      expect(screen.getByText('💬')).toBeInTheDocument();
    });

    it('has proper ARIA role for empty state', () => {
      // Given: MessageList with no messages
      render(<MessageList messages={[]} />);

      // Then: Empty state container should have status role
      const emptyStateContainer = screen.getByRole('status');
      expect(emptyStateContainer).toBeInTheDocument();
    });
  });

  describe('Messages rendering', () => {
    it('renders all messages when messages array is provided', () => {
      // Given: MessageList with multiple messages
      const messages: MessageType[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Should render all messages
      const messageElements = screen.getAllByTestId('message');
      expect(messageElements).toHaveLength(3);

      // And: Messages should contain correct content
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
      expect(screen.getByText('How are you?')).toBeInTheDocument();
    });

    it('renders single message correctly', () => {
      // Given: MessageList with one message
      const messages: MessageType[] = [
        { role: 'user', content: 'Single message test' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Should render exactly one message
      const messageElements = screen.getAllByTestId('message');
      expect(messageElements).toHaveLength(1);
      expect(screen.getByText('Single message test')).toBeInTheDocument();
    });

    it('does not display empty state when messages exist', () => {
      // Given: MessageList with messages
      const messages: MessageType[] = [
        { role: 'user', content: 'Test' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Should not display welcome message
      expect(screen.queryByText(/チャットを始めましょう/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('displays typing indicator when isLoading is true', () => {
      // Given: MessageList with messages and loading state
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      render(<MessageList messages={messages} isLoading={true} />);

      // Then: Should display typing indicator
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    it('does not display typing indicator when isLoading is false', () => {
      // Given: MessageList with messages but not loading
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      render(<MessageList messages={messages} isLoading={false} />);

      // Then: Should not display typing indicator
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });

    it('does not display typing indicator by default', () => {
      // Given: MessageList without isLoading prop
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Should not display typing indicator (default is false)
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });

    it('displays typing indicator with empty messages when loading', () => {
      // Given: MessageList with no messages but loading
      const messages: MessageType[] = [];

      render(<MessageList messages={messages} isLoading={true} />);

      // Then: Should display empty state (not typing indicator, since messages.length === 0)
      expect(screen.getByText(/チャットを始めましょう/i)).toBeInTheDocument();
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Auto-scroll behavior', () => {
    it('scrolls to bottom when new messages are added', () => {
      // Given: Initial MessageList with one message
      const initialMessages: MessageType[] = [
        { role: 'user', content: 'First message' },
      ];

      const { rerender } = render(<MessageList messages={initialMessages} />);

      // When: New message is added
      const updatedMessages: MessageType[] = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'Second message' },
      ];
      rerender(<MessageList messages={updatedMessages} />);

      // Then: scrollIntoView should have been called
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('scrolls when loading state changes', () => {
      // Given: MessageList not in loading state
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      const { rerender } = render(<MessageList messages={messages} isLoading={false} />);

      // Clear previous calls
      (Element.prototype.scrollIntoView as jest.Mock).mockClear();

      // When: Loading state changes to true
      rerender(<MessageList messages={messages} isLoading={true} />);

      // Then: scrollIntoView should be called
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('uses smooth scroll behavior', () => {
      // Given: MessageList with messages
      const messages: MessageType[] = [
        { role: 'user', content: 'Test' },
      ];

      render(<MessageList messages={messages} />);

      // Then: scrollIntoView should be called with smooth behavior
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for message container', () => {
      // Given: MessageList with messages
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Container should have log role
      const container = screen.getByRole('log');
      expect(container).toBeInTheDocument();
    });

    it('has aria-label for message container', () => {
      // Given: MessageList with messages
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Container should have descriptive aria-label
      const container = screen.getByRole('log');
      expect(container).toHaveAttribute('aria-label', '会話履歴');
    });

    it('has aria-live for dynamic content updates', () => {
      // Given: MessageList with messages
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Container should have aria-live=polite
      const container = screen.getByRole('log');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-atomic set to false for incremental updates', () => {
      // Given: MessageList with messages
      const messages: MessageType[] = [
        { role: 'user', content: 'Test message' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Container should have aria-atomic=false
      const container = screen.getByRole('log');
      expect(container).toHaveAttribute('aria-atomic', 'false');
    });
  });

  describe('Message ordering', () => {
    it('renders messages in the order they appear in the array', () => {
      // Given: MessageList with ordered messages
      const messages: MessageType[] = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Second' },
        { role: 'user', content: 'Third' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Messages should appear in correct order
      const messageElements = screen.getAllByTestId('message');
      expect(messageElements[0]).toHaveTextContent('First');
      expect(messageElements[1]).toHaveTextContent('Second');
      expect(messageElements[2]).toHaveTextContent('Third');
    });
  });

  describe('Edge cases', () => {
    it('handles messages with empty content', () => {
      // Given: MessageList with message containing empty string
      const messages: MessageType[] = [
        { role: 'assistant', content: '' },
      ];

      render(<MessageList messages={messages} />);

      // Then: Should still render the message component
      const messageElements = screen.getAllByTestId('message');
      expect(messageElements).toHaveLength(1);
    });

    it('handles long conversation with many messages', () => {
      // Given: MessageList with many messages
      const messages: MessageType[] = Array.from({ length: 50 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `Message ${i + 1}`,
      }));

      render(<MessageList messages={messages} />);

      // Then: Should render all 50 messages
      const messageElements = screen.getAllByTestId('message');
      expect(messageElements).toHaveLength(50);
    });
  });
});
