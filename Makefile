.PHONY: help init dev build test deploy docker-build docker-run clean

# デフォルトのターゲット（helpを表示）
help:
	@echo "使用可能なコマンド:"
	@echo "  make init          - プロジェクトの初期化"
	@echo "  make dev           - 開発サーバーを起動"
	@echo "  make build         - 本番用ビルド"
	@echo "  make test          - テストを実行"
	@echo "  make test-watch    - テストをwatchモードで実行"
	@echo "  make deploy        - Google Cloud Runにデプロイ"
	@echo "  make docker-build  - Dockerイメージをビルド"
	@echo "  make docker-run    - Dockerコンテナを起動"
	@echo "  make clean         - ビルド成果物を削除"
	@echo "  make prisma-generate - Prismaクライアントを生成"
	@echo "  make prisma-push   - Prismaスキーマをデータベースに反映"

# プロジェクトの初期化
init:
	@echo "📦 依存関係をインストール中..."
	npm install
	@echo "🔧 Prismaクライアントを生成中..."
	npx prisma generate
	@echo "✅ 初期化が完了しました！"
	@echo ""
	@echo "次のステップ:"
	@echo "1. .env.localファイルを作成して環境変数を設定"
	@echo "2. make dev で開発サーバーを起動"

# 開発サーバーを起動
dev:
	@echo "🚀 開発サーバーを起動中..."
	npm run dev

# 本番用ビルド
build:
	@echo "🏗️  本番用ビルドを実行中..."
	npm run build
	@echo "✅ ビルドが完了しました！"

# テストを実行
test:
	@echo "🧪 テストを実行中..."
	npm run test

# テストをwatchモードで実行
test-watch:
	@echo "🧪 テストをwatchモードで実行中..."
	npm run test:watch

# Google Cloud Runにデプロイ
deploy:
	@echo "☁️  Google Cloud Runにデプロイ中..."
	@echo "プロジェクトID: $${PROJECT_ID}"
	@if [ -z "$${PROJECT_ID}" ]; then \
		echo "❌ エラー: PROJECT_ID環境変数が設定されていません"; \
		echo "実行例: PROJECT_ID=your-project-id make deploy"; \
		exit 1; \
	fi
	gcloud builds submit --config cloudbuild.yaml
	@echo "✅ デプロイが完了しました！"

# Dockerイメージをビルド
docker-build:
	@echo "🐳 Dockerイメージをビルド中..."
	docker build -t ai-chat .
	@echo "✅ Dockerイメージのビルドが完了しました！"

# Dockerコンテナを起動
docker-run:
	@echo "🐳 Dockerコンテナを起動中..."
	@if [ ! -f .env.local ]; then \
		echo "❌ エラー: .env.localファイルが見つかりません"; \
		exit 1; \
	fi
	docker run -p 8080:8080 --env-file .env.local ai-chat

# ビルド成果物を削除
clean:
	@echo "🧹 ビルド成果物を削除中..."
	rm -rf .next
	rm -rf out
	rm -rf node_modules/.cache
	@echo "✅ クリーンアップが完了しました！"

# Prismaクライアントを生成
prisma-generate:
	@echo "🔧 Prismaクライアントを生成中..."
	npx prisma generate
	@echo "✅ Prismaクライアントの生成が完了しました！"

# Prismaスキーマをデータベースに反映
prisma-push:
	@echo "🔧 Prismaスキーマをデータベースに反映中..."
	npx prisma db push
	@echo "✅ スキーマの反映が完了しました！"
