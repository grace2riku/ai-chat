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

# プロジェクトIDの設定
PROJECT_ID="ai-chat-482021"
REGION="asia-northeast1"
SERVICE_NAME="ai-chat"

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

# DATABASE_URLの入力
echo -n "MongoDB接続文字列 (DATABASE_URL)を入力してください: "
read -s DATABASE_URL
echo ""

# シークレットの作成
echo "シークレットを作成中..."
echo -n "$ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key \
  --data-file=- \
  --replication-policy="automatic" || echo "シークレット 'anthropic-api-key' は既に存在します"

echo -n "$DATABASE_URL" | gcloud secrets create database-url \
  --data-file=- \
  --replication-policy="automatic" || echo "シークレット 'database-url' は既に存在します"

echo -e "${GREEN}✓ シークレットの作成が完了しました${NC}"

# 4. IAM権限の設定
echo -e "${YELLOW}4. IAM権限を設定中...${NC}"

# プロジェクト番号の取得
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Cloud Build サービスアカウントに権限を付与
echo "Cloud Buildサービスアカウントに権限を付与..."
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" || true

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" || true

# Cloud Run サービスアカウントに権限を付与
echo "Cloud Runサービスアカウントに権限を付与..."
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" || true

gcloud secrets add-iam-policy-binding database-url \
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
