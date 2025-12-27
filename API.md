# API ドキュメント

このドキュメントでは、AIチャットボットのAPIエンドポイントについて説明します。

## ベースURL

- **開発環境**: `http://localhost:3000`
- **本番環境**: `https://ai-chat-1093986561582.asia-northeast1.run.app`

## 認証

現在、このAPIは認証を必要としません。

## レート制限

- **制限**: 1分あたり10リクエスト（IPアドレスごと）
- **制限超過時のレスポンス**: HTTP 429 Too Many Requests

## エンドポイント

### GET /api/chat

APIの状態を確認するためのヘルスチェックエンドポイント。

#### リクエスト

```http
GET /api/chat
```

#### レスポンス

**成功時 (200 OK)**

```json
{
  "status": "ok",
  "message": "Chat API is running"
}
```

---

### POST /api/chat

チャットメッセージを送信し、AI応答を取得します。

#### リクエスト

```http
POST /api/chat
Content-Type: application/json
```

#### リクエストボディ

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `message` | string | ✓ | ユーザーのメッセージ（最大2000文字） |
| `conversationHistory` | Message[] | ✓ | 会話履歴の配列 |
| `image` | ImageContent | - | オプショナルな画像データ（マルチモーダル対応） |

##### Message 型

```typescript
{
  role: 'user' | 'assistant';
  content: string | Array<TextContent | ImageContent>;
}
```

##### ImageContent 型

```typescript
{
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string; // Base64エンコードされた画像データ
  };
}
```

##### TextContent 型

```typescript
{
  type: 'text';
  text: string;
}
```

#### リクエスト例

**テキストのみの会話**

```json
{
  "message": "こんにちは！",
  "conversationHistory": []
}
```

**会話履歴ありの場合**

```json
{
  "message": "それについてもっと教えて",
  "conversationHistory": [
    {
      "role": "user",
      "content": "AIについて教えて"
    },
    {
      "role": "assistant",
      "content": "AIは人工知能の略称です。機械学習やディープラーニングなどの技術を用いて、人間の知的活動を模倣するシステムです。"
    }
  ]
}
```

**画像付きメッセージの場合**

```json
{
  "message": "この画像について説明して",
  "conversationHistory": [],
  "image": {
    "type": "image",
    "source": {
      "type": "base64",
      "media_type": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQEAYABgAAD..."
    }
  }
}
```

#### レスポンス

**成功時 (200 OK)**

```json
{
  "response": "こんにちは！何かお手伝いできることはありますか？",
  "timestamp": "2025-12-27T10:30:00.000Z"
}
```

##### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `response` | string | AIからの応答メッセージ |
| `timestamp` | string | レスポンスのタイムスタンプ（ISO 8601形式） |

## エラーレスポンス

すべてのエラーレスポンスは以下の形式で返されます：

```json
{
  "error": "エラーメッセージ",
  "statusCode": 400
}
```

### エラーコード一覧

| ステータスコード | エラーメッセージ | 説明 |
|----------------|-----------------|------|
| 400 | `無効なリクエストです。messageとconversationHistoryを正しく指定してください。` | リクエストボディのバリデーションエラー |
| 429 | `レート制限を超えました。しばらく待ってから再試行してください。` | レート制限超過 |
| 500 | `AI応答の生成中にエラーが発生しました。` | サーバー内部エラー |

### エラー例

**400 Bad Request - 無効なリクエスト**

```json
{
  "error": "無効なリクエストです。messageとconversationHistoryを正しく指定してください。",
  "statusCode": 400
}
```

**429 Too Many Requests - レート制限超過**

```json
{
  "error": "レート制限を超えました。しばらく待ってから再試行してください。",
  "statusCode": 429
}
```

**500 Internal Server Error - サーバーエラー**

```json
{
  "error": "AI応答の生成中にエラーが発生しました。",
  "statusCode": 500
}
```

## 使用例

### cURL

```bash
# ヘルスチェック
curl -X GET https://ai-chat-1093986561582.asia-northeast1.run.app/api/chat

# チャットメッセージ送信
curl -X POST https://ai-chat-1093986561582.asia-northeast1.run.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "こんにちは！",
    "conversationHistory": []
  }'
```

### JavaScript (fetch)

```javascript
// チャットメッセージ送信
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'こんにちは！',
    conversationHistory: [],
  }),
});

const data = await response.json();

if (response.ok) {
  console.log('AI Response:', data.response);
} else {
  console.error('Error:', data.error);
}
```

### TypeScript

```typescript
import type { ChatRequest, ChatResponse, ChatError } from '@/types/chat';

async function sendMessage(
  message: string,
  conversationHistory: Message[] = []
): Promise<ChatResponse> {
  const request: ChatRequest = {
    message,
    conversationHistory,
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ChatError;
    throw new Error(error.error);
  }

  return data as ChatResponse;
}

// 使用例
try {
  const result = await sendMessage('こんにちは！');
  console.log(result.response);
} catch (error) {
  console.error('エラー:', error);
}
```

## バリデーションルール

### メッセージ

- 必須フィールド
- 文字列型
- 空文字列は不可
- 最大2000文字（自動的にトリミングされます）

### 会話履歴

- 必須フィールド（空配列も可）
- 配列型
- 各要素は有効な `Message` オブジェクトである必要があります
- `role` は `"user"` または `"assistant"` のみ
- `content` は文字列、または `TextContent` と `ImageContent` の配列

### 画像

- オプショナルフィールド
- `type` は `"image"` である必要があります
- `source.type` は `"base64"` である必要があります
- `source.media_type` は `image/jpeg`, `image/png`, `image/gif`, `image/webp` のいずれか
- `source.data` は有効なBase64エンコードされた画像データ

## セキュリティ

- すべての入力は自動的にサニタイズされます
- 長すぎる入力（2000文字超）は自動的にトリミングされます
- レート制限により、過度なリクエストを防止します
- 本番環境では必ずHTTPSを使用してください

## パフォーマンス

- 平均レスポンスタイム: 2-5秒（Claude APIのレスポンス時間に依存）
- タイムアウト: 30秒（Cloud Runのデフォルト設定）
- 最大リクエストサイズ: 10MB（画像を含む場合）

## 制限事項

- ストリーミングレスポンスは現在サポートされていません
- 会話履歴は永続化されません（セッション内のみ）
- ファイルアップロードは画像のみサポート
- 音声入力・出力は現在サポートされていません

## サポート

問題が発生した場合は、GitHubのIssueを作成してください。

---

**最終更新**: 2025-12-27
**APIバージョン**: 0.1.0
