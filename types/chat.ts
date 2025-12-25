// チャット関連の型定義

// 画像コンテンツの型
export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
}

// テキストコンテンツの型
export interface TextContent {
  type: 'text';
  text: string;
}

// メッセージコンテンツの型（テキストのみ、または複数のコンテンツ）
export type MessageContent = string | Array<TextContent | ImageContent>;

export interface Message {
  role: 'user' | 'assistant';
  content: MessageContent;
}

export interface ChatRequest {
  message: string;
  conversationHistory: Message[];
  image?: ImageContent; // オプショナルな画像
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

export interface ChatError {
  error: string;
  statusCode: number;
}

// 画像アップロードの型
export interface ImageUploadData {
  file: File;
  preview: string;
  imageContent: ImageContent;
}
