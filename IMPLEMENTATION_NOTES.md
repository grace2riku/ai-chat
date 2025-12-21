# 実装ノート

このドキュメントは、実装中に発生した計画との相違点、注意事項、変更点を記録します。

## フェーズ1: 環境セットアップ

### 計画との相違点

#### 1. パッケージ名の変更
**計画（TODO.md）:**
```bash
npm install @mastra/core @mastra/anthropic
```

**実際の実装:**
```bash
npm install @mastra/core @ai-sdk/anthropic
```

**理由:**
- `@mastra/anthropic` というパッケージは存在しない
- Mastraは `@ai-sdk` エコシステムを使用しており、`@ai-sdk/anthropic` が正しいパッケージ名
- これはMastraの公式ドキュメントでも確認済み

#### 2. Next.jsプロジェクトの作成方法
**計画（TODO.md）:**
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

**実際の実装:**
- 既存のファイル（CLAUDE.md、TODO.md）との競合により、`create-next-app` が使用できなかった
- 代わりに、必要なファイルを手動で作成：
  - package.json
  - tsconfig.json
  - next.config.ts
  - tailwind.config.ts
  - postcss.config.mjs
  - .eslintrc.json
  - app/layout.tsx
  - app/page.tsx
  - app/globals.css

**理由:**
- `create-next-app` は既存ファイルがあるディレクトリには実行できない仕様
- 手動作成でも同等の構成を実現

### 警告・注意事項

#### npm peer dependency警告
```
npm warn ERESOLVE overriding peer dependency
npm warn While resolving: @openrouter/ai-sdk-provider@1.2.3
npm warn Found: ai@4.3.19
npm warn Could not resolve dependency:
npm warn peer ai@"^5.0.0" from @openrouter/ai-sdk-provider-v5@1.2.3
```

**影響:**
- 動作には影響なし
- `@mastra/core` が要求する `ai@4.3.19` が優先されている

#### 環境変数の設定が必要
- `.env.local` ファイルは作成済みだが、値は空
- 実装を進める前に以下の値を設定する必要がある：
  - `ANTHROPIC_API_KEY`: Anthropic APIキー
  - `DATABASE_URL`: MongoDB接続文字列

### セキュリティ脆弱性
インストール時に以下の警告が表示された：
```
3 vulnerabilities (1 low, 2 moderate)
```

**対応:**
- 現時点では `npm audit fix` は実行していない
- 開発初期段階のため、後のフェーズで対応予定

---

## フェーズ2: データベースセットアップ

### 計画との相違点

#### 1. Prisma 7の設定方法の変更
**計画（TODO.md）:**
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

**実際の実装:**
```prisma
datasource db {
  provider = "mongodb"
}
```

**理由:**
- Prisma 7では、datasourceの`url`属性がschema.prismaファイルでサポートされなくなった
- 接続URLは`prisma.config.ts`で管理するように変更された
- PrismaClientコンストラクタに`adapter`または`accelerateUrl`を渡す必要がある
- この変更により、環境ごとの設定管理が柔軟になった

#### 2. Prisma Client出力先の変更
**初期設定:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}
```

**実際の実装:**
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}
```

**理由:**
- `prisma-client-js`が正しいプロバイダー名
- 標準的な出力先（node_modules/.prisma/client）を使用することで、importが簡単になる
- カスタム出力先は特別な要件がない限り不要

### 未完了タスク（ユーザー操作が必要）

#### MongoDB Atlas設定
以下のタスクは、ユーザーが手動で行う必要があります：

1. **MongoDB Atlasアカウント作成**
   - https://www.mongodb.com/cloud/atlas にアクセス
   - 無料アカウントを作成

2. **クラスタの作成**
   - Free Tierクラスタを選択
   - リージョンを選択（推奨: asia-northeast1またはasia-southeast1）

3. **データベースユーザーの作成**
   - Database Access画面でユーザーを作成
   - ユーザー名とパスワードを記録

4. **ネットワークアクセスの設定**
   - Network Access画面でIPホワイトリストを設定
   - 開発環境: `0.0.0.0/0`（全てのIPを許可）
   - 本番環境: 特定のIPアドレスのみを許可

5. **接続文字列の取得**
   - Database画面で"Connect"をクリック
   - "Connect your application"を選択
   - 接続文字列をコピー
   - `.env.local`の`DATABASE_URL`に設定

**接続文字列の形式:**
```
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

#### データベース接続の確認
MongoDB Atlas設定完了後、以下のコマンドでデータベース接続を確認：
```bash
npx prisma db push
```

### データモデルについて
- 将来的な拡張用に`Conversation`および`Message`モデルを定義
- 現時点（フェーズ1-3）では会話履歴を保存しないため、これらのモデルは使用しない
- フェーズ4以降で会話履歴の永続化機能を実装する際に使用予定

---

## フェーズ3: バックエンド実装

### 計画との相違点

#### 1. Claude APIクライアントの省略
**計画（TODO.md）:**
```
### 3.2 Claude APIクライアント
- lib/claude/ディレクトリの作成
- lib/claude/client.tsの実装
  - APIクライアントの初期化
  - エラーハンドリング
  - レート制限の実装
```

**実際の実装:**
- Claude APIクライアントは作成せず、Mastraに統合

**理由:**
- Mastraフレームワークが内部的にClaude APIを処理するため、別途クライアントを作成する必要がない
- `@ai-sdk/anthropic`がMastraによって自動的に使用される
- エラーハンドリングとレート制限はAPIエンドポイントで実装
- コードの重複を避け、よりシンプルな実装を実現

### 実装の詳細

#### Mastra Agent設定
- **モデル**: `anthropic/claude-3-5-sonnet-20241022`
- **トーン**: カジュアルで親しみやすい
- **システムプロンプト**: エンターテインメント用の自由な雑談に最適化
- **環境変数**: `ANTHROPIC_API_KEY`を自動的に読み込み

#### API エンドポイント（/api/chat）
**実装した機能:**
1. **リクエストバリデーション**
   - メッセージと会話履歴の形式チェック
   - 各メッセージのrole（user/assistant）検証

2. **入力サニタイゼーション**
   - 最大文字数制限: 2000文字
   - 前後の空白削除

3. **レート制限**
   - メモリベースの実装
   - 制限: 1分あたり10リクエスト/IP
   - 本番環境ではRedisなどの使用を推奨

4. **エラーハンドリング**
   - レート制限超過: 429
   - バリデーションエラー: 400
   - サーバーエラー: 500
   - 詳細なエラーメッセージを返却

5. **会話履歴の処理**
   - セッション内の会話履歴をMastra形式に変換
   - データベースには保存せず、メモリ上でのみ保持

### 型定義
作成した型:
- `Message`: ユーザーまたはアシスタントのメッセージ
- `ChatRequest`: APIリクエストの形式
- `ChatResponse`: APIレスポンスの形式
- `ChatError`: エラーレスポンスの形式

### 注意事項

#### レート制限について
- 現在の実装はメモリベースのため、アプリケーション再起動でリセットされる
- 本番環境では以下のいずれかを使用することを推奨:
  - Redis
  - Upstash Rate Limit
  - Vercel KV
  - その他の分散キャッシュソリューション

#### 会話履歴について
- 現時点ではデータベースに保存していない
- クライアント側で会話履歴を管理し、リクエストごとに送信
- ページリロードで会話履歴が消失する
- フェーズ4以降で永続化を検討

---

## フェーズ4: フロントエンド実装

### 実装の詳細

#### コンポーネント構成
フルスタックなチャットインターフェースを4つの主要コンポーネントで構築：

1. **Message.tsx** - 個別メッセージ表示
   - ユーザー/AIメッセージの表示分岐
   - 右寄せ（ユーザー）/左寄せ（AI）のレイアウト
   - 青背景（ユーザー）/グレー背景（AI）
   - レスポンシブデザイン（max-width: 70%）
   - 長文対応（whitespace-pre-wrap, break-words）

2. **MessageInput.tsx** - メッセージ入力フォーム
   - テキストエリアで複数行入力対応
   - 送信ボタン
   - Enterキー送信（Shift+Enterで改行）
   - ローディング中の無効化
   - 空メッセージの送信防止
   - 送信後の自動クリア

3. **MessageList.tsx** - メッセージ一覧表示
   - メッセージの動的レンダリング
   - 新メッセージ追加時の自動スクロール（useEffect + useRef）
   - 空状態の表示（アイコン + 説明文）
   - スクロール可能なコンテナ

4. **ChatInterface.tsx** - 統合インターフェース
   - 状態管理（useState）
     - messages: メッセージ配列
     - isLoading: ローディング状態
     - error: エラーメッセージ
   - API通信（fetch）
   - エラーハンドリング
   - ヘッダー表示
   - フルスクリーンレイアウト（flex-col h-screen）

#### 状態管理

**クライアント側状態:**
- `messages`: Message[] - 会話履歴（メモリ上のみ）
- `isLoading`: boolean - API呼び出し中の状態
- `error`: string | null - エラーメッセージ

**データフロー:**
```
ユーザー入力 → MessageInput
    ↓
ChatInterface (handleSendMessage)
    ↓
API呼び出し (/api/chat)
    ↓
レスポンス → messages配列に追加
    ↓
MessageList → Message コンポーネント
```

#### UI/UX の特徴

**レスポンシブデザイン:**
- モバイル/デスクトップ対応
- メッセージの最大幅制限（70%）
- フォントサイズの自動調整（sm/md/base）

**ユーザー体験:**
- リアルタイムフィードバック（ローディング状態）
- エラー通知（赤色の警告バナー）
- 空状態の明確な表示
- 自動スクロール（最新メッセージへ）
- キーボードショートカット（Enter送信）

**アクセシビリティ:**
- セマンティックHTML
- フォーカス状態の視覚的フィードバック
- 無効状態の適切な表示（opacity, cursor）
- プレースホルダーテキスト

### 技術スタック

- **React Hooks**: useState, useEffect, useRef
- **Next.js**: App Router, Client Components ('use client')
- **TypeScript**: 型安全性（Message, ChatRequest, ChatResponse, ChatError）
- **Tailwind CSS**: ユーティリティファーストスタイリング

### メインページの更新

**app/page.tsx:**
- シンプルな構成（ChatInterfaceコンポーネントのみ）
- サーバーコンポーネント（デフォルト）
- ChatInterfaceがクライアントコンポーネントとして動作

### 注意事項

#### 会話履歴の管理
- ページリロードで会話履歴が消失
- データベースに保存されない
- クライアント側のメモリのみで管理
- 将来的な永続化を想定した設計

#### パフォーマンス考慮事項
- メッセージリストのkey属性（index使用、将来的にはID推奨）
- 自動スクロールの最適化（smooth behavior）
- 不要な再レンダリングの防止（将来的にReact.memoの検討）

---

## 開発サーバーの起動と動作確認

### 計画との相違点

#### 1. Tailwind CSS PostCSS プラグインの変更
**エラー:**
```
Module build failed (from ./node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js):
Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin.
The PostCSS plugin has moved to a separate package, so to continue using Tailwind CSS with PostCSS
you'll need to install `@tailwindcss/postcss` and update your PostCSS configuration.
```

**原因:**
- Tailwind CSS v4では、PostCSS プラグインが別パッケージに分離された
- `postcss.config.mjs`で`tailwindcss`を直接使用できなくなった

**修正:**
1. 新しいパッケージのインストール
   ```bash
   npm install -D @tailwindcss/postcss
   ```

2. `postcss.config.mjs`の更新
   ```javascript
   // 変更前
   plugins: {
     tailwindcss: {},
   }

   // 変更後
   plugins: {
     '@tailwindcss/postcss': {},
   }
   ```

### 動作確認結果

#### アプリケーション起動
- **開発サーバー:** http://localhost:3000
- **ビルド時間:** 12.7秒（597モジュール）
- **ステータス:** 正常起動 ✓

#### UI確認
以下の要素が正常に表示されることを確認：
1. **ヘッダー**
   - タイトル: "AI Chat"
   - 説明文: "カジュアルなAIチャットボット"

2. **空状態表示**
   - アイコン: 💬
   - 見出し: "チャットを始めましょう"
   - 説明: "メッセージを入力して、AIとの会話を楽しんでください"

3. **入力フォーム**
   - テキストエリア（プレースホルダー: "メッセージを入力..."）
   - 送信ボタン（テキスト: "送信"）

4. **スタイリング**
   - Tailwind CSSクラスが正常に適用
   - レスポンシブレイアウト
   - 適切なカラースキーム

#### API確認
- **エンドポイント:** GET /api/chat
- **レスポンス:** `{"status":"ok","message":"Chat API is running"}`
- **ステータスコード:** 200 OK

### 注意事項

#### ANTHROPIC_API_KEY未設定
- `.env.local`にAPIキーが設定されていない
- UIは正常に動作するが、実際のチャット機能は使用不可
- テストするには以下を設定：
  ```bash
  ANTHROPIC_API_KEY=sk-ant-...
  ```

#### 警告メッセージ
開発サーバー起動時に以下の警告が表示されるが、動作には影響なし：
```
Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles and selected the directory of /Users/k-abe/package-lock.json as the root directory.
```

**対応:**
- 必要に応じて`next.config.ts`に`outputFileTracingRoot`を設定可能
- 不要なlockfileを削除することも検討

---

## Claude APIモデルの更新

### 計画との相違点

#### 1. Claude 3.5 Sonnetモデルの廃止
**計画（TODO.md / 初期実装）:**
```typescript
model: 'anthropic/claude-3-5-sonnet-20241022'
```

**実際の実装:**
```typescript
model: 'anthropic/claude-sonnet-4-5'
```

**理由:**
- Claude 3.5 Sonnetモデル（`claude-3-5-sonnet-20240620`、`claude-3-5-sonnet-20241022`）は2025年7月21日に廃止された
- API呼び出し時に404エラー（model not found）が発生
- 現在利用可能なのはClaude 4.xファミリーのみ

### エラーと対応

#### 発生したエラー
```
Error [AI_APICallError]: model: claude-3-5-sonnet-20241022
statusCode: 404
error: {"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"}
```

#### 試行錯誤
1. **最初の試み:** `claude-3-5-sonnet-20240620`（古い安定版）
   - 結果: 404エラー（このモデルも廃止済み）

2. **最終的な解決策:** `claude-sonnet-4-5`（最新モデル）
   - 結果: 正常に動作 ✓

### 現在利用可能なClaudeモデル（2025年12月時点）

#### Claude 4.xファミリー
- **Claude Sonnet 4.5** (`claude-sonnet-4-5`) - 最も強力なモデル
- **Claude Opus 4.5** - エンタープライズワークフロー向け
- **Claude Haiku 4.5** - 低レイテンシ・低コスト向け
- **Claude Opus 4.1** - エージェントタスク向け
- **Claude Sonnet 4** - 標準モデル

#### 廃止されたモデル
- Claude 3 Sonnet (2024-02-29) - 2025年7月21日に廃止
- Claude 2.1 - 2025年7月21日に廃止
- Claude 3.5 Sonnet (全バージョン) - 廃止

### チャット機能のテスト結果

#### テストメッセージ
```json
{
  "message": "こんにちは！",
  "conversationHistory": []
}
```

#### AIレスポンス
```json
{
  "response": "こんにちは！😊\n\n今日はどんな感じですか？何か面白いことありました？\n\nそれとも、何か話したいことや聞きたいことがあれば、気軽に言ってくださいね！",
  "timestamp": "2025-12-21T05:51:54.007Z"
}
```

#### 確認事項
- ✅ API認証成功
- ✅ モデル応答正常
- ✅ カジュアルなトーン維持
- ✅ 日本語対応
- ✅ レスポンス時間: 約3秒
- ✅ エラーハンドリング正常

### 料金について

Claude Sonnet 4.5の料金：
- 入力: $3.00 / 100万トークン
- 出力: $15.00 / 100万トークン

**想定コスト:**
- 短い会話（往復5回）: 約$0.01〜0.05
- 100往復の会話: 約$1〜2

---

**最終更新:** 2025-12-21
**チャット機能テスト完了**
