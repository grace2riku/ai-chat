# AI チャットボット

[![Deploy to Cloud Run](https://github.com/grace2riku/ai-chat/actions/workflows/deploy.yml/badge.svg)](https://github.com/grace2riku/ai-chat/actions/workflows/deploy.yml)

Claude AIを使用したカジュアルな雑談ができるチャットボットアプリケーション。

## 特徴

- Claude 3.5 Sonnet を使用した自然な会話
- シンプルで使いやすいUIカジュアルでフレンドリーなトーン
- リアルタイムなレスポンス
- レスポンシブデザイン（モバイル・デスクトップ対応）

## 技術スタック

### フロントエンド
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS

### バックエンド
- Next.js API Routes
- Mastra (AIエージェントフレームワーク)
- Claude API (Anthropic)

### インフラ
- Google Cloud Run
- Cloud Build
- Secret Manager
- Container Registry

## 開発環境のセットアップ

### 前提条件

- Node.js 20.x 以上
- npm
- Anthropic APIキー

### セットアップ手順

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd ai-chat
```

2. **依存関係のインストール**

```bash
npm install
# または
make init
```

3. **環境変数の設定**

`.env.local` ファイルを作成：

```bash
cp .env.example .env.local
```

`.env.local` を編集して、Anthropic API Keyを設定：

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. **開発サーバーの起動**

```bash
npm run dev
# または
make dev
```

5. **ブラウザでアクセス**

```
http://localhost:3000
```

## テスト

```bash
# すべてのテストを実行
npm test
# または
make test

# watchモードでテストを実行
npm run test:watch
# または
make test-watch
```

## デプロイ

### ローカルでのDockerビルド

```bash
# Dockerイメージをビルド
make docker-build

# Dockerコンテナを起動
make docker-run
```

### Google Cloud Runへのデプロイ

#### 初回セットアップ

```bash
# GCPの初期設定
make setup-gcp
```

#### デプロイ実行

```bash
# デプロイ
make deploy
```

詳細な手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## CI/CD

このプロジェクトでは、GitHub Actionsを使用した自動デプロイを設定できます。

### GitHub Actions のセットアップ

詳細な手順は [.github/workflows/SETUP.md](./.github/workflows/SETUP.md) を参照してください。

#### 概要

1. **Workload Identity Federationの設定**
   - サービスアカウントキーを使わずに安全に認証

2. **GitHub Secretsの設定**
   - `GCP_WORKLOAD_IDENTITY_PROVIDER`
   - `GCP_SERVICE_ACCOUNT`

3. **自動デプロイの動作**
   - **Pull Request**: テストが自動実行
   - **main ブランチへのpush**: テスト → ビルド → デプロイが自動実行

### ワークフロー

- **Test Workflow** (`.github/workflows/test.yml`)
  - Pull Requestやブランチへのpush時に実行
  - リンター、テストを実行

- **Deploy Workflow** (`.github/workflows/deploy.yml`)
  - mainブランチへのpush時に実行
  - テスト → Cloud Buildでビルド → Cloud Runへデプロイ

## プロジェクト構成

```
ai-chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main chat page
├── components/
│   ├── ChatInterface.tsx          # Main chat interface
│   ├── MessageList.tsx            # Message list component
│   ├── MessageInput.tsx           # Message input component
│   └── Message.tsx                # Individual message component
├── lib/
│   └── mastra/
│       └── agent.ts               # Mastra AI agent config
├── types/
│   └── chat.ts                    # Type definitions
├── prisma/
│   └── schema.prisma              # Database schema (future use)
├── scripts/
│   ├── setup-gcp.sh               # GCP setup script
│   └── deploy.sh                  # Deployment script
├── .github/
│   └── workflows/
│       ├── deploy.yml             # Deploy workflow
│       ├── test.yml               # Test workflow
│       └── SETUP.md               # CI/CD setup guide
├── Dockerfile                     # Docker configuration
├── cloudbuild.yaml               # Cloud Build configuration
├── Makefile                       # Common commands
└── TODO.md                        # Implementation checklist
```

## 環境変数

### ローカル開発

- `ANTHROPIC_API_KEY`: Anthropic API Key（必須）
- `DATABASE_URL`: MongoDB接続文字列（現在未使用）

### デプロイ用（オプション）

- `GCP_PROJECT_ID`: Google Cloud プロジェクトID
- `GCP_REGION`: デプロイリージョン（デフォルト: asia-northeast1）
- `SERVICE_NAME`: Cloud Runサービス名（デフォルト: ai-chat）

## Makefileコマンド

```bash
make help          # 利用可能なコマンド一覧を表示
make init          # プロジェクトの初期化
make dev           # 開発サーバーを起動
make build         # 本番用ビルド
make test          # テストを実行
make test-watch    # テストをwatchモードで実行
make setup-gcp     # Google Cloudの初期設定
make deploy        # Google Cloud Runにデプロイ
make docker-build  # Dockerイメージをビルド
make docker-run    # Dockerコンテナを起動
make clean         # ビルド成果物を削除
```

## ライセンス

MIT

## 作成者

Claude & User

---

**デプロイ先**: https://ai-chat-1093986561582.asia-northeast1.run.app
