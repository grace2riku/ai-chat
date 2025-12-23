# デプロイメントガイド

このドキュメントでは、AIチャットボットをDockerとGoogle Cloud Runにデプロイする手順を説明します。

## 目次

- [ローカルでのDocker確認](#ローカルでのdocker確認)
- [Google Cloud Runへのデプロイ](#google-cloud-runへのデプロイ)
- [トラブルシューティング](#トラブルシューティング)

---

## ローカルでのDocker確認

### 前提条件

- Docker Desktop がインストールされていること
- `.env.local` ファイルが正しく設定されていること

### 1. Dockerイメージのビルド

プロジェクトルートディレクトリで以下のコマンドを実行します。

```bash
docker build -t ai-chat .
```

ビルドには数分かかる場合があります。マルチステージビルドにより、最終的なイメージサイズは最適化されます。

### 2. Dockerコンテナの起動

環境変数ファイルを使用してコンテナを起動します。

```bash
docker run -p 8080:8080 --env-file .env.local ai-chat
```

または、環境変数を個別に指定する場合：

```bash
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=your_api_key \
  -e DATABASE_URL=your_mongodb_url \
  ai-chat
```

### 3. 動作確認

ブラウザで以下のURLにアクセスして動作を確認します。

```
http://localhost:8080
```

#### 確認項目

- [ ] ページが正常に表示される
- [ ] メッセージを送信できる
- [ ] AIからの応答が返ってくる
- [ ] エラーが発生しないか

### 4. コンテナの停止

```bash
# 実行中のコンテナを確認
docker ps

# コンテナを停止
docker stop <container_id>

# コンテナを削除（オプション）
docker rm <container_id>
```

### 5. イメージの削除（必要に応じて）

```bash
docker rmi ai-chat
```

---

## Google Cloud Runへのデプロイ

### 前提条件

- Google Cloud Platform (GCP) アカウント
- gcloud CLI がインストールされていること
- GCPプロジェクトが作成されていること（プロジェクトID: `ai-chat-482021`）

### クイックスタート（推奨）

最も簡単な方法は、用意されたスクリプトとMakefileコマンドを使用することです。

#### 1. Google Cloud の初期設定

```bash
# Makefileを使用
make setup-gcp

# または、スクリプトを直接実行
./scripts/setup-gcp.sh
```

このコマンドは以下を自動的に実行します：
- gcloud CLIの設定（プロジェクトID、リージョン）
- 必要なAPIの有効化（Cloud Run, Cloud Build, Container Registry, Secret Manager）
- Secret Managerでシークレットの作成（対話的に入力）
- IAM権限の設定

#### 2. アプリケーションのデプロイ

```bash
# Makefileを使用
make deploy

# または、スクリプトを直接実行
./scripts/deploy.sh
```

デプロイ方法を選択できます：
1. **Cloud Build を使用**（推奨）：自動的にビルドとデプロイを実行
2. **ローカルビルド + デプロイ**：ローカルでDockerイメージをビルドしてからデプロイ

---

### 詳細な手順（手動設定）

上記のスクリプトを使用せず、手動で設定する場合は以下の手順に従ってください。

### 1. gcloud CLIの初期設定

```bash
# gcloud CLIにログイン
gcloud auth login

# プロジェクトIDを設定
gcloud config set project YOUR_PROJECT_ID

# デフォルトリージョンを設定
gcloud config set run/region asia-northeast1
```

### 2. 必要なAPIの有効化

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Secret Manager API
gcloud services enable secretmanager.googleapis.com
```

### 3. Secret Managerでシークレットを作成

```bash
# Anthropic APIキーの作成
echo -n "YOUR_ANTHROPIC_API_KEY" | \
  gcloud secrets create anthropic-api-key \
  --data-file=-

# MongoDB接続文字列の作成
echo -n "YOUR_DATABASE_URL" | \
  gcloud secrets create database-url \
  --data-file=-
```

### 4. Secret Manager へのアクセス権限を付与

```bash
# プロジェクト番号を取得
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Cloud Build サービスアカウントに権限を付与
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Cloud Run サービスアカウントに権限を付与
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5. Cloud Buildを使用してデプロイ

```bash
# ビルドとデプロイを実行
gcloud builds submit --config cloudbuild.yaml
```

このコマンドは以下を実行します：
1. Dockerイメージのビルド
2. Container Registryへのイメージプッシュ
3. Cloud Runへのデプロイ

### 6. デプロイの確認

```bash
# サービスの詳細を表示
gcloud run services describe ai-chat --region asia-northeast1

# URLを取得
gcloud run services describe ai-chat \
  --region asia-northeast1 \
  --format="value(status.url)"
```

### 7. ログの確認

```bash
# リアルタイムでログを確認
gcloud run services logs read ai-chat \
  --region asia-northeast1 \
  --follow

# 最新のログを表示
gcloud run services logs read ai-chat \
  --region asia-northeast1 \
  --limit 50
```

---

## 手動デプロイ（Cloud Build を使用しない場合）

Cloud Buildを使用せずに直接デプロイする場合：

```bash
# 1. イメージをビルド
docker build -t gcr.io/YOUR_PROJECT_ID/ai-chat:latest .

# 2. Container Registryにプッシュ
docker push gcr.io/YOUR_PROJECT_ID/ai-chat:latest

# 3. Cloud Runにデプロイ
gcloud run deploy ai-chat \
  --image gcr.io/YOUR_PROJECT_ID/ai-chat:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 60 \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest,DATABASE_URL=database-url:latest
```

---

## 環境変数の更新

デプロイ後に環境変数を更新する場合：

```bash
# Secret Managerのシークレットを更新
echo -n "NEW_API_KEY" | gcloud secrets versions add anthropic-api-key --data-file=-

# Cloud Runサービスは自動的に最新バージョンを使用します
# または、サービスを再デプロイして変更を反映
gcloud run services update ai-chat --region asia-northeast1
```

---

## トラブルシューティング

### ビルドエラー

**問題**: Dockerビルドが失敗する

**解決策**:
1. `.dockerignore` が正しく設定されているか確認
2. `node_modules` を削除してから再ビルド
3. Dockerのキャッシュをクリア: `docker build --no-cache -t ai-chat .`

### コンテナ起動エラー

**問題**: コンテナが起動しない

**解決策**:
1. 環境変数が正しく設定されているか確認
2. ログを確認: `docker logs <container_id>`
3. ポート8080が既に使用されていないか確認

### Cloud Runデプロイエラー

**問題**: デプロイが失敗する

**解決策**:
1. 必要なAPIが有効化されているか確認
2. Secret Managerの権限が正しく設定されているか確認
3. Cloud Buildのログを確認:
   ```bash
   gcloud builds log --region=asia-northeast1
   ```

### アプリケーションエラー

**問題**: デプロイは成功したが、アプリケーションが動作しない

**解決策**:
1. Cloud Runのログを確認
2. 環境変数が正しく設定されているか確認
3. Anthropic APIキーが有効か確認
4. MongoDB接続文字列が正しいか確認

---

## パフォーマンス最適化

### メモリとCPUの調整

アプリケーションの負荷に応じて、リソースを調整できます。

```bash
gcloud run services update ai-chat \
  --region asia-northeast1 \
  --memory 2Gi \
  --cpu 2
```

### オートスケーリングの設定

```bash
gcloud run services update ai-chat \
  --region asia-northeast1 \
  --min-instances 1 \
  --max-instances 20
```

### タイムアウトの調整

```bash
gcloud run services update ai-chat \
  --region asia-northeast1 \
  --timeout 300
```

---

## セキュリティ考慮事項

1. **認証の追加**: 本番環境では、適切な認証を実装してください
2. **HTTPS**: Cloud Runは自動的にHTTPSを使用します
3. **Secret管理**: APIキーは必ずSecret Managerで管理してください
4. **IAM権限**: 最小権限の原則に従ってIAM権限を設定してください

---

## CI/CD設定（オプション）

GitHub Actionsを使用した自動デプロイの設定については、TODO.mdのフェーズ10を参照してください。

---

## 参考リンク

- [Cloud Run ドキュメント](https://cloud.google.com/run/docs)
- [Cloud Build ドキュメント](https://cloud.google.com/build/docs)
- [Secret Manager ドキュメント](https://cloud.google.com/secret-manager/docs)
- [Next.js Deployment ドキュメント](https://nextjs.org/docs/deployment)

---

**最終更新日**: 2025-12-22
