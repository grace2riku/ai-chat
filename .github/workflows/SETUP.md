# GitHub Actions CI/CD セットアップガイド

このガイドでは、GitHub ActionsからGoogle Cloud Runへ自動デプロイするための設定手順を説明します。

## 前提条件

- Google Cloud Platformプロジェクト（`ai-chat-482021`）が作成済み
- GitHubリポジトリへの管理者権限
- gcloud CLIがインストール済み

## 1. Workload Identity Federation の設定

Workload Identity Federationを使用することで、サービスアカウントキーを使わずに安全に認証できます。

### 1.1 Workload Identity Poolの作成

```bash
# プロジェクトIDを設定
PROJECT_ID="ai-chat-482021"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Workload Identity Poolを作成
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Workload Identity Providerを作成
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 1.2 サービスアカウントの作成と権限付与

```bash
# サービスアカウントを作成
gcloud iam service-accounts create github-actions-sa \
  --project="$PROJECT_ID" \
  --display-name="GitHub Actions Service Account"

# サービスアカウントに必要な権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### 1.3 Workload Identity Federationの紐付け

GitHubリポジトリのオーナー名とリポジトリ名を設定してください：

```bash
# GitHubリポジトリの情報を設定
GITHUB_REPO_OWNER="your-github-username"  # 例: "grace2riku"
GITHUB_REPO_NAME="ai-chat"

# Workload Identity Federationを紐付け
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
```

## 2. GitHub Secrets の設定

GitHubリポジトリに以下のSecretsを設定します。

### 2.1 Workload Identity Provider の取得

```bash
# Workload Identity Provider のリソース名を取得
gcloud iam workload-identity-pools providers describe "github-actions-provider" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"
```

出力例：
```
projects/1093986561582/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
```

### 2.2 GitHub Secretsに登録

GitHubリポジトリの Settings > Secrets and variables > Actions で以下を設定：

1. **`GCP_WORKLOAD_IDENTITY_PROVIDER`**
   - 上記コマンドで取得した値
   - 例: `projects/1093986561582/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider`

2. **`GCP_SERVICE_ACCOUNT`**
   - サービスアカウントのメールアドレス
   - 例: `github-actions-sa@ai-chat-482021.iam.gserviceaccount.com`

## 3. ワークフローの動作確認

### 3.1 テストワークフロー

Pull Requestを作成すると、自動的にテストが実行されます：
- `.github/workflows/test.yml` が実行される
- テストが失敗するとマージがブロックされる

### 3.2 デプロイワークフロー

mainブランチにpushまたはマージすると、自動的にデプロイが実行されます：
- `.github/workflows/deploy.yml` が実行される
- テスト → ビルド → デプロイの順で実行
- デプロイが成功するとサービスURLが表示される

### 3.3 手動デプロイ

GitHub Actions の画面から手動でデプロイを実行できます：
1. リポジトリの「Actions」タブを開く
2. 「Deploy to Cloud Run」ワークフローを選択
3. 「Run workflow」ボタンをクリック

## 4. トラブルシューティング

### 認証エラーが発生する場合

```bash
# サービスアカウントの権限を確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Workload Identity Poolの確認

```bash
# Workload Identity Poolの一覧
gcloud iam workload-identity-pools list --location=global --project=$PROJECT_ID

# Providerの確認
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=github-actions-pool \
  --location=global \
  --project=$PROJECT_ID
```

## 5. セキュリティのベストプラクティス

1. **最小権限の原則**
   - サービスアカウントには必要最小限の権限のみを付与
   - 定期的に権限を見直す

2. **Workload Identity Federationの使用**
   - サービスアカウントキーを使用しない
   - GitHubリポジトリごとに異なるサービスアカウントを使用

3. **監査ログの確認**
   - Cloud Loggingで定期的にアクセスログを確認
   - 異常なアクティビティを検知

## 参考リンク

- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions で Google Cloud に認証する](https://github.com/google-github-actions/auth)
- [Cloud Build ドキュメント](https://cloud.google.com/build/docs)
