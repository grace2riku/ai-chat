#!/bin/bash

# Cloud Run デプロイスクリプト
# このスクリプトは、AI ChatアプリケーションをGoogle Cloud Runにデプロイします。

set -e

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo -e "${BLUE}=== AI Chat デプロイ ===${NC}"
echo "プロジェクトID: $PROJECT_ID"
echo "リージョン: $REGION"
echo "サービス名: $SERVICE_NAME"
echo ""

# 現在のプロジェクトを確認
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
  echo -e "${YELLOW}プロジェクトを $PROJECT_ID に切り替えます...${NC}"
  gcloud config set project $PROJECT_ID
fi

# デプロイ方法の選択
echo "デプロイ方法を選択してください:"
echo "1. Cloud Build を使用（推奨）"
echo "2. ローカルビルド + デプロイ"
echo -n "選択 (1/2): "
read -r DEPLOY_METHOD

if [ "$DEPLOY_METHOD" = "1" ]; then
  # Cloud Build を使用
  echo -e "${YELLOW}Cloud Build を使用してデプロイします...${NC}"
  echo ""

  # Gitコミットハッシュを取得
  COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
  echo "コミットSHA: $COMMIT_SHA"

  gcloud builds submit --config cloudbuild.yaml --substitutions=COMMIT_SHA=$COMMIT_SHA

  echo ""
  echo -e "${GREEN}✓ デプロイが完了しました！${NC}"

elif [ "$DEPLOY_METHOD" = "2" ]; then
  # ローカルビルド + デプロイ
  echo -e "${YELLOW}ローカルでDockerイメージをビルドします...${NC}"

  # Dockerイメージのビルド
  COMMIT_SHA=$(git rev-parse --short HEAD)
  IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:$COMMIT_SHA"

  docker build -t "$IMAGE_NAME" .
  docker tag "$IMAGE_NAME" "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

  echo -e "${YELLOW}Container Registryにプッシュします...${NC}"
  docker push "$IMAGE_NAME"
  docker push "gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

  echo -e "${YELLOW}Cloud Runにデプロイします...${NC}"
  gcloud run deploy $SERVICE_NAME \
    --image "$IMAGE_NAME" \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --timeout 60 \
    --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest

  echo ""
  echo -e "${GREEN}✓ デプロイが完了しました！${NC}"

else
  echo -e "${RED}無効な選択です${NC}"
  exit 1
fi

# サービスのURLを取得
echo ""
echo -e "${YELLOW}サービス情報を取得中...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format="value(status.url)")

echo ""
echo -e "${GREEN}=== デプロイ完了 ===${NC}"
echo -e "${BLUE}サービスURL:${NC} $SERVICE_URL"
echo ""
echo "次のステップ:"
echo "1. ブラウザでアクセス: $SERVICE_URL"
echo "2. ログを確認: gcloud run services logs read $SERVICE_NAME --region $REGION"
echo "3. サービスの詳細: gcloud run services describe $SERVICE_NAME --region $REGION"
echo ""
