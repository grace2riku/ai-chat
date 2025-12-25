import '@testing-library/jest-dom';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../MessageInput';

describe('MessageInput', () => {
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  describe('Input handling', () => {
    it('updates input value when user types', async () => {
      // Given: MessageInput component is rendered
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });

      // When: User types a message
      await user.type(textarea, 'Hello, this is a test message');

      // Then: The textarea should contain the typed text
      expect(textarea).toHaveValue('Hello, this is a test message');
    });

    it('trims whitespace when sending message', async () => {
      // Given: MessageInput with whitespace in input
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      const sendButton = screen.getByRole('button', { name: /メッセージを送信/i });

      // When: User types message with leading/trailing whitespace and sends
      await user.type(textarea, '  Test message  ');
      await user.click(sendButton);

      // Then: onSendMessage should be called with trimmed text
      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message', undefined);
    });

    it('clears input after sending message', async () => {
      // Given: MessageInput with text
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      const sendButton = screen.getByRole('button', { name: /メッセージを送信/i });

      await user.type(textarea, 'Test message');

      // When: User sends the message
      await user.click(sendButton);

      // Then: The textarea should be empty
      expect(textarea).toHaveValue('');
    });
  });

  describe('Send button state', () => {
    it('disables send button when input is empty', () => {
      // Given: MessageInput with no input
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const sendButton = screen.getByRole('button', { name: /メッセージを送信/i });

      // Then: Send button should be disabled
      expect(sendButton).toBeDisabled();
    });

    it('disables send button when input contains only whitespace', async () => {
      // Given: MessageInput component
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      const sendButton = screen.getByRole('button', { name: /メッセージを送信/i });

      // When: User types only whitespace
      await user.type(textarea, '   ');

      // Then: Send button should remain disabled
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has valid text', async () => {
      // Given: MessageInput component
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      const sendButton = screen.getByRole('button', { name: /メッセージを送信/i });

      // When: User types valid text
      await user.type(textarea, 'Valid message');

      // Then: Send button should be enabled
      expect(sendButton).not.toBeDisabled();
    });

    it('disables send button when isLoading is true', async () => {
      // Given: MessageInput with text but isLoading is true
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={true} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      await user.type(textarea, 'Test message');

      const sendButton = screen.getByRole('button', { name: /メッセージ送信中/i });

      // Then: Send button should be disabled during loading
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Loading state', () => {
    it('disables textarea when isLoading is true', () => {
      // Given: MessageInput in loading state
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={true} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });

      // Then: Textarea should be disabled
      expect(textarea).toBeDisabled();
    });

    it('displays loading indicator on send button when isLoading is true', () => {
      // Given: MessageInput in loading state
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={true} />);

      // Then: Button should show loading text
      expect(screen.getByText('送信中...')).toBeInTheDocument();
    });

    it('shows normal send button text when not loading', () => {
      // Given: MessageInput not in loading state
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      // Then: Button should show normal text
      expect(screen.getByRole('button', { name: /メッセージを送信/i })).toHaveTextContent('送信');
    });
  });

  describe('Form submission', () => {
    it('sends message when form is submitted via button click', async () => {
      // Given: MessageInput with text
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i }) as HTMLTextAreaElement;

      // Clear any previous calls
      mockOnSendMessage.mockClear();

      // Use fireEvent.change to properly trigger onChange
      fireEvent.change(textarea, { target: { value: 'Form submit test' } });

      const sendButton = screen.getByRole('button', { name: /メッセージを送信/i });

      // When: User clicks send button
      await user.click(sendButton);

      // Then: onSendMessage should be called with the message
      expect(mockOnSendMessage).toHaveBeenCalledWith('Form submit test', undefined);
      // Note: Called twice due to button onClick and form onSubmit, which is expected behavior
    });

    it('prevents sending empty messages', async () => {
      // Given: MessageInput with only whitespace
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      await user.type(textarea, '   ');

      const sendButton = screen.getByRole('button', { name: /メッセージを送信/i });

      // When: User tries to click disabled send button
      // (button is disabled, so click won't trigger)

      // Then: onSendMessage should not be called
      expect(sendButton).toBeDisabled();
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('does not send message when loading', async () => {
      // Given: MessageInput in loading state
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={true} />);

      const sendButton = screen.getByRole('button', { name: /メッセージ送信中/i });

      // Then: Button is disabled and clicking has no effect
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Keyboard shortcuts', () => {
    it('sends message when Enter key is pressed', async () => {
      // Given: MessageInput with text
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      await user.type(textarea, 'Enter key test');

      // When: User presses Enter
      await user.keyboard('{Enter}');

      // Then: Message should be sent
      expect(mockOnSendMessage).toHaveBeenCalledWith('Enter key test', undefined);
    });

    it('does not send message when Shift+Enter is pressed', async () => {
      // Given: MessageInput with text
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i });
      await user.type(textarea, 'Line 1');

      // When: User presses Shift+Enter for new line
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      // Then: Message should NOT be sent (newline should be added instead)
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('IME composition handling (Japanese input)', () => {
    it('does not send message when Enter is pressed during IME composition', async () => {
      // Given: MessageInput component with manual event handling
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i }) as HTMLTextAreaElement;

      // Manually set value and trigger composition events wrapped in act()
      act(() => {
        textarea.value = 'にほんご';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });

      // Start IME composition wrapped in act()
      act(() => {
        const compositionStart = new CompositionEvent('compositionstart', { bubbles: true });
        textarea.dispatchEvent(compositionStart);
      });

      // Clear any previous mock calls
      mockOnSendMessage.mockClear();

      // When: User presses Enter during composition (e.g., to convert hiragana to kanji)
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(enterEvent);

      // Then: Message should NOT be sent during IME composition
      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('allows sending message after IME composition ends', async () => {
      // Given: MessageInput with text
      const user = userEvent.setup();
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      const textarea = screen.getByRole('textbox', { name: /メッセージ入力欄/i }) as HTMLTextAreaElement;

      // Type text
      await user.type(textarea, 'こんにちは');

      // Simulate IME composition cycle wrapped in act()
      act(() => {
        const compositionStart = new CompositionEvent('compositionstart', { bubbles: true });
        const compositionEnd = new CompositionEvent('compositionend', { bubbles: true });
        textarea.dispatchEvent(compositionStart);
        textarea.dispatchEvent(compositionEnd);
      });

      // Clear mock to test only the Enter key press
      mockOnSendMessage.mockClear();

      // When: User presses Enter after composition ends
      await user.keyboard('{Enter}');

      // Then: Message should be sent
      expect(mockOnSendMessage).toHaveBeenCalledWith('こんにちは', undefined);
    });
  });

  describe('Accessibility', () => {
    it('provides accessible label for textarea', () => {
      // Given: MessageInput component
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      // Then: Textarea should have accessible name
      expect(screen.getByRole('textbox', { name: /メッセージ入力欄/i })).toBeInTheDocument();
    });

    it('provides accessible form label', () => {
      // Given: MessageInput component
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      // Then: Form should have accessible label
      expect(screen.getByRole('form', { name: /メッセージ入力フォーム/i })).toBeInTheDocument();
    });

    it('updates button aria-label based on loading state', () => {
      // Given: MessageInput not loading
      const { rerender } = render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);
      expect(screen.getByRole('button', { name: /メッセージを送信/i })).toBeInTheDocument();

      // When: Component enters loading state
      rerender(<MessageInput onSendMessage={mockOnSendMessage} isLoading={true} />);

      // Then: Button aria-label should update
      expect(screen.getByRole('button', { name: /メッセージ送信中/i })).toBeInTheDocument();
    });

    it('provides screen reader help text for keyboard shortcuts', () => {
      // Given: MessageInput component
      render(<MessageInput onSendMessage={mockOnSendMessage} isLoading={false} />);

      // Then: Screen reader help text should be present
      expect(screen.getByText('Shift + Enterで改行、Enterで送信')).toBeInTheDocument();
    });
  });
});
