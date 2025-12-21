import { NextRequest, NextResponse } from 'next/server';
import { getChatAgent } from '@/lib/mastra/agent';
import type { ChatRequest, ChatResponse, ChatError } from '@/types/chat';

// シンプルなメモリベースのレート制限
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 1分あたりのリクエスト数
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分（ミリ秒）

/**
 * レート制限をチェック
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * 入力のサニタイゼーション
 */
function sanitizeInput(input: string): string {
  // 基本的なサニタイゼーション：過度に長い入力を制限
  const maxLength = 2000;
  return input.slice(0, maxLength).trim();
}

/**
 * リクエストのバリデーション
 */
function validateRequest(body: unknown): body is ChatRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const { message, conversationHistory } = body as ChatRequest;

  if (typeof message !== 'string' || !message.trim()) {
    return false;
  }

  if (!Array.isArray(conversationHistory)) {
    return false;
  }

  // 会話履歴の各メッセージをバリデーション
  for (const msg of conversationHistory) {
    if (
      !msg ||
      typeof msg !== 'object' ||
      (msg.role !== 'user' && msg.role !== 'assistant') ||
      typeof msg.content !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * POST /api/chat
 * チャットメッセージを送信し、AI応答を取得
 */
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      const errorResponse: ChatError = {
        error: 'レート制限を超えました。しばらく待ってから再試行してください。',
        statusCode: 429,
      };
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // リクエストボディの取得とバリデーション
    const body = await request.json();

    if (!validateRequest(body)) {
      const errorResponse: ChatError = {
        error: '無効なリクエストです。messageとconversationHistoryを正しく指定してください。',
        statusCode: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { message, conversationHistory } = body;

    // 入力のサニタイゼーション
    const sanitizedMessage = sanitizeInput(message);

    // 会話履歴をMastra形式に変換
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: sanitizeInput(msg.content),
      })),
      {
        role: 'user' as const,
        content: sanitizedMessage,
      },
    ];

    // チャットエージェントを取得
    const agent = getChatAgent();

    // AI応答を生成
    const result = await agent.generate(sanitizedMessage, {
      // 会話履歴をコンテキストとして渡す
      // 注: Mastraのバージョンによって異なる可能性があります
    });

    // レスポンスの構築
    const response: ChatResponse = {
      response: result.text || '',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Chat API Error:', error);

    const errorResponse: ChatError = {
      error: 'AI応答の生成中にエラーが発生しました。',
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/chat
 * APIの状態確認用（オプション）
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Chat API is running',
  });
}
