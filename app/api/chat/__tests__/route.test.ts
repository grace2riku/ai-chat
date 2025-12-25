/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import type { ChatRequest, ChatResponse, ChatError } from '@/types/chat';

// Mock the Mastra agent
jest.mock('@/lib/mastra/agent', () => ({
  getChatAgent: jest.fn(() => ({
    generate: jest.fn(async (message: string) => ({
      text: `Mock response to: ${message}`,
    })),
  })),
}));

// Helper function to create NextRequest for testing
function createMockRequest(path: string, options: RequestInit = {}): NextRequest {
  return new NextRequest(new Request(`http://localhost:3000${path}`, options));
}

describe('/api/chat', () => {
  // Use unique IP for each test to avoid rate limit conflicts
  let testIpCounter = 0;
  function getUniqueTestIP() {
    return `192.168.${Math.floor(testIpCounter / 255)}.${testIpCounter++ % 255}`;
  }

  describe('GET endpoint', () => {
    it('returns API status when GET request is made', async () => {
      // Given: GET request to /api/chat
      // When: GET handler is called
      const response = await GET();

      // Then: Should return 200 status with API status
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        status: 'ok',
        message: 'Chat API is running',
      });
    });
  });

  describe('POST endpoint - Request validation', () => {
    it('returns successful response for valid request', async () => {
      // Given: Valid chat request
      const requestBody: ChatRequest = {
        message: 'Hello, AI!',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 200 status
      expect(response.status).toBe(200);

      const data: ChatResponse = await response.json();
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('timestamp');
      expect(data.response).toContain('Mock response to: Hello, AI!');
    });

    it('rejects request with missing message field', async () => {
      // Given: Request without message field
      const requestBody = {
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);

      const data: ChatError = await response.json();
      expect(data.error).toBe('無効なリクエストです。messageとconversationHistoryを正しく指定してください。');
      expect(data.statusCode).toBe(400);
    });

    it('rejects request with empty message', async () => {
      // Given: Request with empty message
      const requestBody: ChatRequest = {
        message: '',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with whitespace-only message', async () => {
      // Given: Request with whitespace-only message
      const requestBody: ChatRequest = {
        message: '   ',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with missing conversationHistory', async () => {
      // Given: Request without conversationHistory
      const requestBody = {
        message: 'Hello',
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with invalid conversationHistory type', async () => {
      // Given: Request with conversationHistory as non-array
      const requestBody = {
        message: 'Hello',
        conversationHistory: 'not an array',
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with invalid message role in conversationHistory', async () => {
      // Given: Request with invalid role
      const requestBody = {
        message: 'Hello',
        conversationHistory: [
          { role: 'invalid-role', content: 'Test' },
        ],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with non-string content in conversationHistory', async () => {
      // Given: Request with non-string content
      const requestBody = {
        message: 'Hello',
        conversationHistory: [
          { role: 'user', content: 123 },
        ],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });
  });

  describe('POST endpoint - Input sanitization', () => {
    it('trims whitespace from message', async () => {
      // Given: Request with whitespace around message
      const requestBody: ChatRequest = {
        message: '  Hello  ',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should succeed and trim the message
      expect(response.status).toBe(200);
      const data: ChatResponse = await response.json();
      expect(data.response).toContain('Mock response to: Hello');
    });

    it('truncates message exceeding maximum length', async () => {
      // Given: Request with very long message (> 2000 chars)
      const longMessage = 'a'.repeat(3000);
      const requestBody: ChatRequest = {
        message: longMessage,
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should succeed and truncate to 2000 chars
      expect(response.status).toBe(200);
      const data: ChatResponse = await response.json();
      // The response should contain truncated message (2000 'a's)
      expect(data.response).toContain('a'.repeat(2000));
    });

    it('sanitizes conversation history messages', async () => {
      // Given: Request with conversation history containing long messages
      const requestBody: ChatRequest = {
        message: 'New message',
        conversationHistory: [
          { role: 'user', content: '  Previous message  ' },
        ],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should succeed (history is sanitized internally)
      expect(response.status).toBe(200);
    });
  });

  describe('POST endpoint - Rate limiting', () => {
    beforeEach(() => {
      // Clear rate limit between tests
      jest.clearAllMocks();
    });

    it('allows requests within rate limit', async () => {
      // Given: Valid request
      const requestBody: ChatRequest = {
        message: 'Test message',
        conversationHistory: [],
      };

      // When: Making 5 requests (within limit of 10)
      for (let i = 0; i < 5; i++) {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
          },
        });

        const response = await POST(request);

        // Then: All requests should succeed
        expect(response.status).toBe(200);
      }
    });

    it('blocks requests exceeding rate limit', async () => {
      // Given: Valid request from same IP
      const requestBody: ChatRequest = {
        message: 'Test message',
        conversationHistory: [],
      };

      const ipAddress = '192.168.1.100';

      // When: Making 11 requests (exceeds limit of 10)
      const responses = [];
      for (let i = 0; i < 11; i++) {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ipAddress,
          },
        });

        responses.push(await POST(request));
      }

      // Then: 11th request should be rate limited
      const lastResponse = responses[10];
      expect(lastResponse.status).toBe(429);

      const data: ChatError = await lastResponse.json();
      expect(data.error).toContain('レート制限を超えました');
      expect(data.statusCode).toBe(429);
    });

    it('tracks rate limit per IP address separately', async () => {
      // Given: Valid requests from different IPs
      const requestBody: ChatRequest = {
        message: 'Test message',
        conversationHistory: [],
      };

      // When: Making requests from different IP addresses
      const request1 = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const request2 = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.2',
        },
      });

      const response1 = await POST(request1);
      const response2 = await POST(request2);

      // Then: Both should succeed (different IPs have separate limits)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('POST endpoint - Conversation history', () => {
    it('handles request with conversation history', async () => {
      // Given: Request with conversation history
      const requestBody: ChatRequest = {
        message: 'What did I just say?',
        conversationHistory: [
          { role: 'user', content: 'My name is Alice' },
          { role: 'assistant', content: 'Nice to meet you, Alice!' },
        ],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully
      expect(response.status).toBe(200);
      const data: ChatResponse = await response.json();
      expect(data.response).toBeTruthy();
    });

    it('handles empty conversation history', async () => {
      // Given: Request with empty conversation history
      const requestBody: ChatRequest = {
        message: 'First message',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully
      expect(response.status).toBe(200);
    });
  });

  describe('POST endpoint - Response format', () => {
    it('returns response with required fields', async () => {
      // Given: Valid request
      const requestBody: ChatRequest = {
        message: 'Hello',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);
      const data: ChatResponse = await response.json();

      // Then: Response should have required fields
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.response).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });

    it('returns valid ISO timestamp', async () => {
      // Given: Valid request
      const requestBody: ChatRequest = {
        message: 'What time is it?',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);
      const data: ChatResponse = await response.json();

      // Then: Timestamp should be valid ISO string
      expect(data.timestamp).toBeTruthy();
      const date = new Date(data.timestamp);
      expect(date.toISOString()).toBe(data.timestamp);
    });
  });

  describe('POST endpoint - Error handling', () => {
    it('handles agent generate errors gracefully', async () => {
      // Given: Request that will cause agent error
      const { getChatAgent } = require('@/lib/mastra/agent');
      getChatAgent.mockImplementationOnce(() => ({
        generate: jest.fn(async () => {
          throw new Error('Agent error');
        }),
      }));

      const requestBody: ChatRequest = {
        message: 'This will fail',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 500 error
      expect(response.status).toBe(500);
      const data: ChatError = await response.json();
      expect(data.error).toBe('AI応答の生成中にエラーが発生しました。');
      expect(data.statusCode).toBe(500);
    });

    it('handles malformed JSON gracefully', async () => {
      // Given: Request with invalid JSON
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid json{',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return error (likely 500 due to JSON parse error)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST endpoint - Multimodal support', () => {
    it('accepts request with valid image attachment', async () => {
      // Given: Request with image content
      const requestBody: ChatRequest = {
        message: 'What is in this image?',
        conversationHistory: [],
        image: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully
      expect(response.status).toBe(200);
      const data: ChatResponse = await response.json();
      expect(data).toHaveProperty('response');
      expect(data).toHaveProperty('timestamp');
    });

    it('accepts request with JPEG image', async () => {
      // Given: Request with JPEG image
      const requestBody: ChatRequest = {
        message: 'Describe this photo',
        conversationHistory: [],
        image: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//aAAgBAQABPwBH/9k=',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully
      expect(response.status).toBe(200);
    });

    it('accepts request with GIF image', async () => {
      // Given: Request with GIF image
      const requestBody: ChatRequest = {
        message: 'What is this?',
        conversationHistory: [],
        image: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/gif',
            data: 'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully
      expect(response.status).toBe(200);
    });

    it('accepts request with WebP image', async () => {
      // Given: Request with WebP image
      const requestBody: ChatRequest = {
        message: 'Analyze this image',
        conversationHistory: [],
        image: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/webp',
            data: 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully
      expect(response.status).toBe(200);
    });

    it('handles conversation history with multimodal content', async () => {
      // Given: Request with image and conversation history containing multimodal content
      const requestBody: ChatRequest = {
        message: 'And this one?',
        conversationHistory: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What is in this image?' },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: 'previous-image-data',
                },
              },
            ],
          },
          { role: 'assistant', content: 'I see a cat in the image.' },
        ],
        image: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'new-image-data',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully
      expect(response.status).toBe(200);
      const data: ChatResponse = await response.json();
      expect(data.response).toBeTruthy();
    });

    it('rejects request with invalid image structure (missing type)', async () => {
      // Given: Request with invalid image (missing type field)
      const requestBody = {
        message: 'What is this?',
        conversationHistory: [],
        image: {
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with invalid image structure (missing source)', async () => {
      // Given: Request with invalid image (missing source)
      const requestBody = {
        message: 'What is this?',
        conversationHistory: [],
        image: {
          type: 'image',
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with invalid image structure (missing data)', async () => {
      // Given: Request with invalid image (missing base64 data)
      const requestBody = {
        message: 'What is this?',
        conversationHistory: [],
        image: {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with invalid image structure (missing media_type)', async () => {
      // Given: Request with invalid image (missing media_type)
      const requestBody = {
        message: 'What is this?',
        conversationHistory: [],
        image: {
          type: 'image',
          source: {
            type: 'base64',
            data: 'test-data',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('rejects request with wrong image type value', async () => {
      // Given: Request with wrong type value
      const requestBody = {
        message: 'What is this?',
        conversationHistory: [],
        image: {
          type: 'video',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: 'test-data',
          },
        },
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should return 400 error
      expect(response.status).toBe(400);
    });

    it('accepts request without image (backward compatibility)', async () => {
      // Given: Request without image field (text-only)
      const requestBody: ChatRequest = {
        message: 'Hello, AI!',
        conversationHistory: [],
      };

      const request = createMockRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': getUniqueTestIP(),
        },
      });

      // When: POST handler is called
      const response = await POST(request);

      // Then: Should process successfully (backward compatibility)
      expect(response.status).toBe(200);
      const data: ChatResponse = await response.json();
      expect(data.response).toBeTruthy();
    });
  });
});
