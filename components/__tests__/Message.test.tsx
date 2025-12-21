import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Message from '../Message';
import type { Message as MessageType } from '@/types/chat';

describe('Message', () => {
  describe('User message rendering', () => {
    it('renders user message with correct content and accessibility label', () => {
      // Given: A user message
      const userMessage: MessageType = {
        role: 'user',
        content: 'Hello, AI!',
      };

      // When: The component is rendered
      render(<Message message={userMessage} />);

      // Then: The message content should be visible
      expect(screen.getByText('Hello, AI!')).toBeInTheDocument();

      // And: It should have the correct aria-label for user messages
      const messageContainer = screen.getByRole('article');
      expect(messageContainer).toHaveAttribute('aria-label', 'あなたのメッセージ');
    });

    it('applies user-specific CSS classes for right alignment', () => {
      // Given: A user message
      const userMessage: MessageType = {
        role: 'user',
        content: 'Test message',
      };

      // When: The component is rendered
      render(<Message message={userMessage} />);

      // Then: The container should have justify-end class for right alignment
      const messageContainer = screen.getByRole('article');
      expect(messageContainer).toHaveClass('justify-end');
    });
  });

  describe('AI message rendering', () => {
    it('renders AI message with correct content and accessibility label', () => {
      // Given: An AI assistant message
      const aiMessage: MessageType = {
        role: 'assistant',
        content: 'こんにちは！お手伝いできることはありますか？',
      };

      // When: The component is rendered
      render(<Message message={aiMessage} />);

      // Then: The message content should be visible
      expect(screen.getByText('こんにちは！お手伝いできることはありますか？')).toBeInTheDocument();

      // And: It should have the correct aria-label for AI messages
      const messageContainer = screen.getByRole('article');
      expect(messageContainer).toHaveAttribute('aria-label', 'AIの応答');
    });

    it('applies AI-specific CSS classes for left alignment', () => {
      // Given: An AI assistant message
      const aiMessage: MessageType = {
        role: 'assistant',
        content: 'Test response',
      };

      // When: The component is rendered
      render(<Message message={aiMessage} />);

      // Then: The container should have justify-start class for left alignment
      const messageContainer = screen.getByRole('article');
      expect(messageContainer).toHaveClass('justify-start');
    });
  });

  describe('Message content formatting', () => {
    it('preserves whitespace and line breaks in message content', () => {
      // Given: A message with multiple lines and whitespace
      const multilineMessage: MessageType = {
        role: 'user',
        content: 'Line 1\nLine 2\n  Indented line',
      };

      // When: The component is rendered
      const { container } = render(<Message message={multilineMessage} />);

      // Then: The content container should have whitespace-pre-wrap class
      const contentDiv = container.querySelector('.whitespace-pre-wrap');
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveTextContent('Line 1');
    });

    it('handles long words with word breaking', () => {
      // Given: A message with a very long word
      const longWordMessage: MessageType = {
        role: 'user',
        content: 'supercalifragilisticexpialidocious',
      };

      // When: The component is rendered
      const { container } = render(<Message message={longWordMessage} />);

      // Then: The content container should have break-words class
      const contentDiv = container.querySelector('.break-words');
      expect(contentDiv).toBeInTheDocument();
      expect(contentDiv).toHaveTextContent('supercalifragilisticexpialidocious');
    });
  });

  describe('Memoization behavior', () => {
    it('does not re-render when props are unchanged', () => {
      // Given: A message and initial render
      const message: MessageType = {
        role: 'user',
        content: 'Test message',
      };

      const { rerender } = render(<Message message={message} />);
      const firstRender = screen.getByText('Test message');

      // When: Component is re-rendered with the same props
      rerender(<Message message={message} />);
      const secondRender = screen.getByText('Test message');

      // Then: The DOM element should be the same (not re-created)
      expect(firstRender).toBe(secondRender);
    });

    it('re-renders when message content changes', () => {
      // Given: Initial message
      const initialMessage: MessageType = {
        role: 'user',
        content: 'Original message',
      };

      const { rerender } = render(<Message message={initialMessage} />);
      expect(screen.getByText('Original message')).toBeInTheDocument();

      // When: Message content is updated
      const updatedMessage: MessageType = {
        role: 'user',
        content: 'Updated message',
      };
      rerender(<Message message={updatedMessage} />);

      // Then: The new content should be displayed
      expect(screen.getByText('Updated message')).toBeInTheDocument();
      expect(screen.queryByText('Original message')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides semantic HTML structure with article role', () => {
      // Given: Any message
      const message: MessageType = {
        role: 'assistant',
        content: 'Accessibility test',
      };

      // When: The component is rendered
      render(<Message message={message} />);

      // Then: It should use article role for semantic HTML
      expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('maintains accessibility for empty messages', () => {
      // Given: A message with empty content
      const emptyMessage: MessageType = {
        role: 'assistant',
        content: '',
      };

      // When: The component is rendered
      render(<Message message={emptyMessage} />);

      // Then: The article should still exist with proper aria-label
      const messageContainer = screen.getByRole('article');
      expect(messageContainer).toHaveAttribute('aria-label', 'AIの応答');
    });
  });
});
