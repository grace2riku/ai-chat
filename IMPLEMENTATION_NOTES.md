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

**最終更新:** 2025-12-19
**フェーズ3完了時点**
