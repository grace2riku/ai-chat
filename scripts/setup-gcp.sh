#!/bin/bash

# Google Cloud Platform セットアップスクリプト
# このスクリプトは、AI ChatアプリケーションをCloud Runにデプロイするために
# 必要なGCPリソースとサービスを設定します。

set -e

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# プロジェクトIDとリージョンの設定
# 環境変数 > gcloud設定 > デフォルト値の優先順位で設定
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="${SERVICE_NAME:-ai-chat}"

# プロジェクトIDが設定されていない場合はエラー
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  echo -e "${RED}エラー: プロジェクトIDが設定されていません${NC}"
  echo "以下のいずれかの方法で設定してください:"
  echo "  1. 環境変数: export GCP_PROJECT_ID=your-project-id"
  echo "  2. gcloud設定: gcloud config set project your-project-id"
  exit 1
fi

echo -e "${GREEN}=== Google Cloud Platform セットアップ ===${NC}"
echo "プロジェクトID: $PROJECT_ID"
echo "リージョン: $REGION"
echo "サービス名: $SERVICE_NAME"
echo ""

# 1. gcloud設定
echo -e "${YELLOW}1. gcloud CLIの設定...${NC}"
gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

# 2. 必要なAPIの有効化
echo -e "${YELLOW}2. 必要なAPIを有効化中...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

echo -e "${GREEN}✓ APIの有効化が完了しました${NC}"

# 3. Secret Managerでシークレットを作成
echo -e "${YELLOW}3. Secret Managerでシークレットを作成...${NC}"

# ANTHROPIC_API_KEYの入力
echo -n "Anthropic API Keyを入力してください: "
read -s ANTHROPIC_API_KEY
echo ""

# シークレットの作成
echo "シークレットを作成中..."
echo -n "$ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key \
  --data-file=- \
  --replication-policy="automatic" || echo "シークレット 'anthropic-api-key' は既に存在します"

echo -e "${GREEN}✓ シークレットの作成が完了しました${NC}"

# 注: DATABASE_URLは現在使用していないため、作成していません
# 将来的にデータベースを使用する場合は、以下のコマンドで作成してください:
# echo -n "$DATABASE_URL" | gcloud secrets create database-url \
#   --data-file=- \
#   --replication-policy="automatic"

# 4. IAM権限の設定
echo -e "${YELLOW}4. IAM権限を設定中...${NC}"

# プロジェクト番号の取得
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Cloud Run サービスアカウントに権限を付与
echo "Cloud Runサービスアカウントに権限を付与..."
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" || true

echo -e "${GREEN}✓ IAM権限の設定が完了しました${NC}"

# 5. セットアップ完了
echo ""
echo -e "${GREEN}=== セットアップが完了しました ===${NC}"
echo ""
echo "次のステップ:"
echo "1. アプリケーションをデプロイ:"
echo "   ./scripts/deploy.sh"
echo ""
echo "2. または、Makefileを使用:"
echo "   make deploy"
echo ""
