# AIチャットボット仕様書

## プロジェクト概要

### 目的
エンターテインメントを目的とした自由な雑談ができるAIチャットボット。カジュアルなトーンでユーザーと自然な会話を提供する。

### ターゲットユーザー
- 気軽にAIと会話を楽しみたいユーザー
- エンターテインメントとしてチャットボットを利用したいユーザー

### プロジェクトスコープ
- シンプルなWebベースのチャットインターフェース
- Claude AIとのリアルタイム対話機能
- 最小限の機能で使いやすさを重視

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **スタイリング**: CSS Modules / Tailwind CSS（推奨）
- **UIライブラリ**: シンプルなチャットコンポーネント

### バックエンド
- **フレームワーク**: Next.js App Router + Hono
- **ORM**: Prisma.js
- **データベース**: MongoDB
- **AIエージェントフレームワーク**: Mastra
- **AI API**: Anthropic Claude API

### インフラストラクチャ
- **デプロイ**: Google Cloud Platform (Cloud Run)
- **データベースホスティング**: MongoDB Atlas（推奨）
- **環境変数管理**: Google Cloud Secret Manager

## 機能要件

### 必須機能
1. **AIとの対話**
   - ユーザーからのメッセージ入力
   - Claude APIを使用したAI応答生成
   - リアルタイムでの会話表示
   - マルチターン対話（セッション内での文脈維持）

2. **チャットインターフェース**
   - メッセージ入力フォーム
   - 会話履歴の表示（セッション内のみ、ページリロードで消失）
   - 送信ボタンとEnterキーでの送信
   - ローディング状態の表示

3. **UI/UX**
   - シンプルで清潔なデザイン
   - レスポンシブデザイン（モバイル・デスクトップ対応）
   - 直感的な操作性

### 除外機能
- 会話履歴の永続的保存
- ユーザー認証・ログイン機能
- ファイルアップロード機能
- 多言語対応
- 画像認識・音声入力などの特殊機能

## システムアーキテクチャ

### アーキテクチャ概要図
```
[ユーザー]
    ↓
[Next.js Frontend (App Router)]
    ↓
[Hono API Routes]
    ↓
[Mastra (AIエージェントフレームワーク)]
    ↓
[Claude API (Anthropic)]

[MongoDB] ← 将来的な拡張用（現時点では使用しない）
```

### コンポーネント構成

#### フロントエンド
- `app/page.tsx` - メインチャットページ
- `components/ChatInterface.tsx` - チャット画面コンポーネント
- `components/MessageList.tsx` - メッセージ一覧表示
- `components/MessageInput.tsx` - メッセージ入力フォーム
- `components/Message.tsx` - 個別メッセージコンポーネント

#### バックエンド
- `app/api/chat/route.ts` - チャットAPIエンドポイント（Hono使用）
- `lib/mastra/agent.ts` - Mastra AIエージェント設定
- `lib/claude/client.ts` - Claude API クライアント
- `prisma/schema.prisma` - データベーススキーマ（将来的な拡張用）

## データモデル

### 現時点
会話履歴は保存しないため、データベースモデルは不要。セッション内のメモリ上でのみ会話を保持。

### 将来的な拡張用（参考）
```prisma
model Conversation {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionId String   @unique
  messages  Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id             String       @id @default(auto()) @map("_id") @db.ObjectId
  conversationId String       @db.ObjectId
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  role           String       // "user" or "assistant"
  content        String
  createdAt      DateTime     @default(now())
}
```

## API設計

### エンドポイント

#### POST /api/chat
チャットメッセージを送信し、AI応答を取得

**リクエスト**
```typescript
{
  "message": string,
  "conversationHistory": Array<{
    role: "user" | "assistant",
    content: string
  }>
}
```

**レスポンス**
```typescript
{
  "response": string,
  "timestamp": string
}
```

**エラーレスポンス**
```typescript
{
  "error": string,
  "statusCode": number
}
```

### Mastra統合

MastraフレームワークでClaude APIを統合し、エージェント的な動作を実現：

```typescript
// lib/mastra/agent.ts の例
import { Mastra } from '@mastra/core';
import { AnthropicProvider } from '@mastra/anthropic';

export const mastra = new Mastra({
  provider: new AnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
  agent: {
    name: 'casual-chat-bot',
    systemPrompt: 'あなたはカジュアルで親しみやすいAIアシスタントです。ユーザーと楽しく自由な会話をしてください。',
    model: 'claude-3-5-sonnet-20241022',
  },
});
```

## UI/UX設計

### デザインコンセプト
- **シンプル**: 不要な装飾を排除し、使いやすさを最優先
- **クリーン**: 白を基調とした清潔感のあるデザイン
- **レスポンシブ**: あらゆるデバイスで快適に使用可能

### カラーパレット
```css
:root {
  --primary: #2563eb; /* メインカラー */
  --secondary: #64748b; /* セカンダリカラー */
  --background: #ffffff; /* 背景色 */
  --surface: #f8fafc; /* サーフェス */
  --text-primary: #0f172a; /* メインテキスト */
  --text-secondary: #64748b; /* サブテキスト */
  --border: #e2e8f0; /* ボーダー */
  --user-message: #2563eb; /* ユーザーメッセージ背景 */
  --ai-message: #f1f5f9; /* AIメッセージ背景 */
}
```

### レイアウト
```
+----------------------------------+
|         Header (タイトル)        |
+----------------------------------+
|                                  |
|                                  |
|        Message List              |
|        (スクロール可能)           |
|                                  |
|                                  |
+----------------------------------+
|   Message Input + Send Button    |
+----------------------------------+
```

## セキュリティ考慮事項

### API セキュリティ
- **環境変数**: APIキーは環境変数で管理（`.env.local`）
- **レート制限**: APIリクエストのレート制限を実装
- **入力検証**: ユーザー入力のサニタイゼーションとバリデーション
- **CORS設定**: 適切なCORS設定

### データ保護
- **XSS対策**: React のデフォルトエスケープを活用
- **HTTPS**: 本番環境では必ずHTTPS使用
- **Secret管理**: Google Cloud Secret Managerで機密情報を管理

## パフォーマンス要件

### レスポンスタイム
- **初回ロード**: 3秒以内
- **メッセージ送信→AI応答**: 5秒以内（通常）
- **UI操作レスポンス**: 100ms以内

### スケーラビリティ
- Cloud Runの自動スケーリングを活用
- 同時接続数: 初期は100ユーザーまで対応
- APIリクエスト: 1ユーザーあたり1分に10リクエストまで

### 最適化
- **コード分割**: Next.js の dynamic imports 活用
- **画像最適化**: Next.js Image コンポーネント使用
- **キャッシング**: 適切なキャッシュ戦略（静的アセット）

## デプロイメント

### Google Cloud Run デプロイ

#### 前提条件
- Google Cloud Platform アカウント
- gcloud CLI インストール
- プロジェクトの作成と設定

#### デプロイ手順

1. **Dockerfileの準備**
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
```

2. **Cloud Build設定**
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/ai-chat:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/ai-chat:$COMMIT_SHA']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'ai-chat'
      - '--image'
      - 'gcr.io/$PROJECT_ID/ai-chat:$COMMIT_SHA'
      - '--region'
      - 'asia-northeast1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
```

3. **環境変数設定**
```bash
gcloud run services update ai-chat \
  --set-env-vars="ANTHROPIC_API_KEY=your-api-key" \
  --set-env-vars="DATABASE_URL=your-mongodb-url"
```

### CI/CD
- GitHub Actions または Cloud Build でCI/CD パイプラインを構築
- mainブランチへのプッシュで自動デプロイ

## 開発環境セットアップ

### 必要なツール
- Node.js 20.x 以上
- npm または yarn
- MongoDB（ローカルまたはMongoDB Atlas）
- Anthropic APIキー

### セットアップ手順

1. **リポジトリクローン**
```bash
git clone <repository-url>
cd ai-chat
```

2. **依存関係インストール**
```bash
npm install
```

3. **環境変数設定**
`.env.local` ファイルを作成：
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/ai-chat"
```

4. **Prismaセットアップ**
```bash
npx prisma generate
npx prisma db push
```

5. **開発サーバー起動**
```bash
npm run dev
```

6. **ブラウザでアクセス**
```
http://localhost:3000
```

### 推奨VSCode拡張機能
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense

## プロジェクト構成

```
ai-chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint (Hono)
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main chat page
├── components/
│   ├── ChatInterface.tsx          # Main chat interface
│   ├── MessageList.tsx            # Message list component
│   ├── MessageInput.tsx           # Message input component
│   └── Message.tsx                # Individual message component
├── lib/
│   ├── mastra/
│   │   └── agent.ts               # Mastra AI agent config
│   └── claude/
│       └── client.ts              # Claude API client
├── prisma/
│   └── schema.prisma              # Database schema
├── public/                        # Static assets
├── styles/                        # Global styles
├── .env.local                     # Environment variables (gitignored)
├── .gitignore
├── Dockerfile                     # Docker configuration
├── cloudbuild.yaml               # Cloud Build configuration
├── next.config.js                # Next.js configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 今後の拡張可能性

現在のシンプルな実装から、将来的に以下の機能追加が可能：

### フェーズ2: 基本的な永続化
- 会話履歴の保存（MongoDB使用）
- セッション管理
- 会話のエクスポート機能

### フェーズ3: ユーザー管理
- ユーザー認証（NextAuth.js）
- ユーザーごとの会話履歴管理
- プロフィール設定

### フェーズ4: 高度な機能
- ファイルアップロード対応
- 画像認識（Claude Vision API）
- 音声入力・出力
- 複数のAIモデル選択機能
- カスタムキャラクター設定

### フェーズ5: エンターテインメント強化
- ゲーム要素の追加
- ストーリーモード
- マルチプレイヤー対話
- コミュニティ機能

## テスト戦略

### 単体テスト
- Jest + React Testing Library
- コンポーネントテスト
- APIルートテスト

### E2Eテスト
- Playwright または Cypress
- 主要なユーザーフロー検証

### テストカバレッジ目標
- コンポーネント: 80%以上
- APIルート: 90%以上
- ユーティリティ関数: 100%

### テストコード作成時の厳守事項

#### ⚠️ 絶対に守ってください！

##### 1. テストコードの品質
- **テストは必ず実際の機能を検証すること**
  - `expect(true).toBe(true)`のような意味のないアサーションは絶対に書かない
  - 各テストケースは具体的な入力と期待される出力を検証すること
  - モックは必要最小限に留め、実際の動作に近い形でテストすること
  - テストが通っているだけでなく、実際の品質を保証できているか常に確認すること

##### 2. ハードコーディングの禁止
- **テストを通すためだけのハードコードは絶対に禁止**
  - 本番コードに`if (testMode)`や`if (process.env.NODE_ENV === 'test')`のような条件分岐を入れない
  - テスト用の特別な値（マジックナンバー）を本番コードに埋め込まない
  - 環境変数や設定ファイルを使用して、テスト環境と本番環境を適切に分離すること
  - テストが通るように本番コードを歪めることは絶対に避ける

##### 3. テスト実装の原則
- **Red-Green-Refactorサイクルを守ること**
  1. Red: テストが失敗する状態から始める
  2. Green: テストが通る最小限の実装を行う
  3. Refactor: コードをリファクタリングする
- **境界値、異常系、エラーケースも必ずテストすること**
  - 正常系だけでなく、エッジケースも網羅する
  - エラーハンドリングが正しく機能することを確認する
- **カバレッジだけでなく、実際の品質を重視すること**
  - 100%のカバレッジでも品質が保証されるわけではない
  - 重要なビジネスロジックやユーザーフローを優先的にテストする
- **テストケース名は何をテストしているか明確に記述すること**
  - 良い例: `「空のメッセージは送信できない」`
  - 悪い例: `「test1」`、`「動作確認」`

##### 4. 実装前の確認
- **機能の仕様を正しく理解してからテストを書くこと**
  - 不明な点があれば、仮の実装ではなく、ユーザーに確認すること
  - 推測で実装せず、明確な要件に基づいてテストを作成すること
- **テストファーストを心がける**
  - 可能な限り、実装の前にテストを書く
  - テストを書くことで仕様の曖昧さを発見できる

##### 5. 避けるべきアンチパターン
- ❌ 空のテスト、常に成功するテスト
- ❌ 本番コードに`__test__`フラグを追加
- ❌ テストのためだけの public メソッド追加
- ❌ モックに依存しすぎて、実際の動作を検証しないテスト
- ❌ 一つのテストで複数の異なる機能をテスト
- ❌ テスト間の依存関係（テストAが成功しないとテストBが失敗する、など）

##### 6. 推奨されるベストプラクティス
- ✅ Given-When-Then パターンを使用
  - Given: 前提条件のセットアップ
  - When: テスト対象の実行
  - Then: 結果の検証
- ✅ AAA（Arrange-Act-Assert）パターンを使用
- ✅ 各テストは独立して実行可能にする
- ✅ テストデータは意味のある値を使用（例: "test@example.com" より "user@example.com"）
- ✅ テストの可読性を重視（コメントが必要なら、テスト名を改善する）

## まとめ

このAIチャットボットは、シンプルさと使いやすさを重視したエンターテインメント向けアプリケーションです。Next.js、Hono、Mastra、Claude APIを組み合わせることで、モダンで拡張性の高いアーキテクチャを実現しています。

最小限の機能からスタートし、ユーザーフィードバックに基づいて段階的に機能を拡張していくアプローチを採用しています。Google Cloud Runを使用することで、スケーラブルで管理しやすいインフラストラクチャを構築できます。

---

**ドキュメントバージョン**: 1.1
**最終更新日**: 2025-12-21
**作成者**: Claude & User
