# AIチャットボット 実装TODO

このドキュメントは、CLAUDE.mdの仕様に基づいたアプリケーション構築の実行計画です。

## 進捗状況

- 🟢 完了
- 🟡 進行中
- ⚪ 未着手

---

## フェーズ1: 環境セットアップ

### 1.1 プロジェクト初期化
- [x] Next.jsプロジェクトの作成
  ```bash
  npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
  ```
- [x] パッケージマネージャーの選択（npm推奨）
- [x] Git管理の確認（既に完了）

### 1.2 依存パッケージのインストール
- [x] Core依存関係
  ```bash
  npm install @ai-sdk/anthropic
  npm install @mastra/core
  npm install hono
  npm install @prisma/client
  ```
- [x] 開発依存関係
  ```bash
  npm install -D prisma
  npm install -D @types/node
  ```

### 1.3 環境変数設定
- [x] `.env.local`ファイルの作成
- [x] 環境変数の設定
  - `ANTHROPIC_API_KEY`
  - `DATABASE_URL` (MongoDB接続文字列)
- [x] `.env.example`ファイルの作成（テンプレート用）

---

## フェーズ2: データベースセットアップ

### 2.1 MongoDB設定
- [ ] MongoDB Atlasアカウント作成（まだの場合）
- [ ] クラスタの作成
- [ ] データベースユーザーの作成
- [ ] ネットワークアクセスの設定（IPホワイトリスト）
- [ ] 接続文字列の取得

### 2.2 Prisma設定
- [x] Prismaの初期化
  ```bash
  npx prisma init --datasource-provider mongodb
  ```
- [x] `prisma/schema.prisma`の設定
  - MongoDBプロバイダーの設定
  - データモデルの定義（将来的な拡張用）
  - Conversation および Message モデルを定義
- [x] Prismaクライアントの生成
  ```bash
  npx prisma generate
  ```
- [ ] データベース接続の確認（MongoDB接続文字列設定後に実行）
  ```bash
  npx prisma db push
  ```

---

## フェーズ3: バックエンド実装

### 3.1 Mastra設定
- [x] `lib/mastra/`ディレクトリの作成
- [x] `lib/mastra/agent.ts`の実装
  - Mastraインスタンスの作成
  - Anthropicプロバイダーの設定（anthropic/claude-3-5-sonnet-20241022）
  - システムプロンプトの設定（カジュアルなトーン）
  - Claude モデルの指定

### 3.2 Claude APIクライアント
- [x] `lib/claude/`ディレクトリの作成（スキップ - Mastraが内部処理）
- [x] `lib/claude/client.ts`の実装（スキップ - Mastraが内部処理）
  - Mastraを使用するため、別途Claude APIクライアントは不要
  - エラーハンドリングとレート制限はAPIエンドポイントで実装

### 3.3 型定義
- [x] `types/`ディレクトリの作成
- [x] `types/chat.ts`の作成
  - Message型の定義
  - ChatRequest型の定義
  - ChatResponse型の定義
  - ChatError型の定義

### 3.4 APIエンドポイント実装
- [x] `app/api/chat/route.ts`の作成
- [x] POST /api/chat エンドポイントの実装
  - リクエストバリデーション
  - 会話履歴の処理
  - Mastraを使用したAI応答生成
  - レスポンスの返却
  - エラーハンドリング
- [x] レート制限の実装（メモリベース、1分あたり10リクエスト）
- [x] 入力サニタイゼーション（最大2000文字）

---

## フェーズ4: フロントエンド実装

### 4.1 コンポーネント構造の作成
- [x] `components/`ディレクトリの作成
- [x] 必要なコンポーネントファイルの作成
  - `components/ChatInterface.tsx`
  - `components/MessageList.tsx`
  - `components/MessageInput.tsx`
  - `components/Message.tsx`

### 4.2 Message.tsxの実装
- [x] メッセージコンポーネントの実装
  - ユーザー/AI メッセージの表示分岐
  - スタイリング（ユーザー: 右寄せ青背景、AI: 左寄せグレー背景）
  - レスポンシブデザイン対応

### 4.3 MessageInput.tsxの実装
- [x] 入力フォームの実装
  - テキストエリア
  - 送信ボタン
  - Enterキーでの送信（Shift+Enterで改行）
  - ローディング状態の処理
  - 入力値のクリア
  - 無効状態の適切な表示

### 4.4 MessageList.tsxの実装
- [x] メッセージリストの実装
  - メッセージの表示
  - 自動スクロール（最新メッセージへ）
  - 空状態の表示（アイコンと説明文）

### 4.5 ChatInterface.tsxの実装
- [x] チャットインターフェースの統合
  - 状態管理（useState使用）
  - メッセージ送信ハンドラー
  - API呼び出し（/api/chat）
  - エラーハンドリング
  - ローディング状態管理
  - ヘッダーの実装

### 4.6 メインページの実装
- [x] `app/page.tsx`の実装
  - ChatInterfaceコンポーネントの配置
  - シンプルな構成

### 4.7 レイアウトの実装
- [x] `app/layout.tsx`の更新（フェーズ1で完了）
  - メタデータの設定
  - グローバルスタイル

---

## フェーズ5: スタイリング

### 5.1 グローバルスタイル
- [x] `app/globals.css`の更新
  - CSS変数の定義（カラーパレット）
  - リセットスタイル
  - ベーススタイル

### 5.2 Tailwind CSS設定
- [x] `tailwind.config.ts`の設定
  - カスタムカラーの追加
  - カスタムスペーシング
  - レスポンシブブレークポイント

### 5.3 コンポーネントスタイリング
- [x] 各コンポーネントのスタイリング
  - レスポンシブデザイン対応
  - ホバー/フォーカス状態
  - アニメーション（フェードイン、スライドなど）

---

## フェーズ6: 機能拡張と最適化

### 6.1 UX改善
- [x] ローディングインジケーター（タイピングアニメーション）
- [x] エラーメッセージの表示
- [x] メッセージ送信時のアニメーション
- [x] 空状態のプレースホルダー改善

### 6.2 パフォーマンス最適化
- [x] React.memoの適用（必要な箇所）
- [x] useCallbackの使用
- [x] 画像最適化（ロゴやアイコンがある場合）
- [x] コード分割（dynamic import）

### 6.3 アクセシビリティ
- [x] ARIAラベルの追加
- [x] キーボードナビゲーション対応
- [x] セマンティックHTML使用
- [x] カラーコントラストの確認

---

## フェーズ7: テスト

### 7.1 テスト環境のセットアップ
- [x] Jest + React Testing Libraryのインストール
  ```bash
  npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @testing-library/user-event ts-node
  ```
- [x] `jest.config.ts`の設定
- [x] `jest.setup.ts`の作成
- [x] package.jsonにテストスクリプトを追加

### 7.2 単体テスト
- [x] コンポーネントテスト
  - Message.tsx (7テスト: 役割別表示、CSS適用、フォーマット、メモ化、アクセシビリティ)
  - MessageInput.tsx (18テスト: 入力処理、ボタン状態、ローディング、フォーム送信、キーボードショートカット、IME対応、アクセシビリティ)
  - MessageList.tsx (18テスト: 空状態、メッセージ表示、ローディング、自動スクロール、アクセシビリティ、メッセージ順序、エッジケース)
- [x] ユーティリティ関数テスト（該当なし）

### 7.3 APIテスト
- [x] `/api/chat`エンドポイントのテスト（30テスト）
  - GET エンドポイント
  - POST リクエストバリデーション（正常系・異常系）
  - 入力サニタイゼーション
  - レート制限
  - 会話履歴処理
  - レスポンス形式
  - エラーハンドリング

### 7.4 E2Eテスト（オプション）
- [ ] Playwrightのセットアップ
- [ ] 主要フローのE2Eテスト
  - メッセージ送信フロー
  - エラーハンドリング

**テスト結果**:
- テストスイート: 4 passed, 4 total
- テスト: 73 passed, 73 total
- カバレッジ: components, app/api/chat

---

## フェーズ8: デプロイ準備

### 8.1 Next.js設定
- [x] `next.config.js`の最適化
  - 本番環境設定
  - 画像最適化設定
  - 出力設定（standalone mode）

### 8.2 Dockerファイル作成
- [x] `Dockerfile`の作成
  - マルチステージビルド
  - 最適化されたイメージサイズ
  - ポート8080の公開
- [x] `.dockerignore`の作成

### 8.3 Cloud Build設定
- [x] `cloudbuild.yaml`の作成
  - ビルドステップの定義
  - Cloud Runデプロイ設定
  - 環境変数の設定

### 8.4 ローカルでのDocker確認
- [x] Dockerイメージのビルド
  ```bash
  docker build -t ai-chat .
  ```
- [x] Dockerコンテナの実行
  ```bash
  docker run -p 8080:8080 --env-file .env.local ai-chat
  ```
- [x] 動作確認

---

## フェーズ9: Google Cloud デプロイ

### 9.1 GCP設定
- [x] Google Cloud Platformプロジェクトの作成
- [x] 必要なAPIの有効化
  - Cloud Run API
  - Cloud Build API
  - Container Registry API
  - Secret Manager API
- [x] gcloud CLIのインストールと設定
  ```bash
  gcloud init
  gcloud auth login
  gcloud config set project [PROJECT_ID]
  ```

### 9.2 Secret Manager設定
- [x] シークレットの作成
  ```bash
  echo -n "YOUR_ANTHROPIC_API_KEY" | gcloud secrets create anthropic-api-key --data-file=-
  echo -n "YOUR_DATABASE_URL" | gcloud secrets create database-url --data-file=-
  ```
- [x] Cloud Runサービスアカウントへの権限付与

### 9.3 初回デプロイ
- [ ] Cloud Buildトリガーの設定（オプション）
- [x] 手動デプロイの実行
  ```bash
  gcloud builds submit --config cloudbuild.yaml
  ```
- [x] Cloud Run設定の確認
  - リージョン: asia-northeast1
  - 認証: 未認証のアクセスを許可
  - メモリ: 512MB〜1GB
  - CPU: 1

### 9.4 環境変数とシークレット設定
- [x] Cloud Runサービスに環境変数を設定
  ```bash
  gcloud run services update ai-chat \
    --update-secrets=ANTHROPIC_API_KEY=anthropic-api-key:latest \
    --update-secrets=DATABASE_URL=database-url:latest \
    --region=asia-northeast1
  ```

### 9.5 デプロイ確認
- [x] デプロイされたURLへアクセス
- [x] 機能テスト
  - メッセージ送信
  - AI応答確認
  - エラーハンドリング確認
- [x] ログの確認
  ```bash
  gcloud run services logs read ai-chat --region=asia-northeast1
  ```

---

## フェーズ10: CI/CD設定（オプション）

### 10.1 GitHub Actions設定
- [x] `.github/workflows/`ディレクトリの作成
- [x] `deploy.yml`の作成
  - mainブランチへのpush時にデプロイ
  - テスト実行
  - ビルド
  - Cloud Runへのデプロイ
- [x] `test.yml`の作成
  - Pull Request時にテスト実行
- [x] セットアップガイド（SETUP.md）の作成

### 10.2 デプロイワークフロー
- [x] GCP認証情報の設定手順書を作成
  - Workload Identity Federationの設定
  - GitHub Secretsの設定
- [x] Workload Identity Federationの実際の設定（手動実行が必要）
- [x] ワークフローのテスト
- [x] 自動デプロイの確認

---

## フェーズ11: ドキュメント整備

### 11.1 README.md
- [x] プロジェクト概要
- [x] 機能説明
- [x] セットアップ手順
- [x] 開発方法
- [x] デプロイ方法
- [ ] スクリーンショット（実際の画像が必要なため未完了）

### 11.2 API ドキュメント
- [x] エンドポイント仕様
- [x] リクエスト/レスポンス例
- [x] エラーコード一覧

### 11.3 その他
- [x] CONTRIBUTING.md（コントリビューションガイド）
- [x] LICENSE（ライセンス選択）

---

## フェーズ12: 監視と運用

### 12.1 ロギング
- [ ] Cloud Loggingの設定
- [ ] エラーログの確認
- [ ] アクセスログの分析

### 12.2 監視
- [ ] Cloud Monitoringダッシュボードの作成
- [ ] アラートの設定
  - エラーレート
  - レスポンスタイム
  - リソース使用率

### 12.3 パフォーマンス測定
- [ ] Lighthouseスコアの測定
- [ ] Core Web Vitalsの確認
- [ ] 改善点の特定と実施

---

## 今後の拡張（将来的な機能）

### 将来のフェーズ
- [ ] 会話履歴の永続化
- [ ] ユーザー認証の実装
- [ ] セッション管理
- [ ] ファイルアップロード機能
- [ ] ダークモード対応
- [ ] 多言語対応
- [ ] PWA対応

---

## メモ・課題

### 実装中の注意点
- セキュリティ: APIキーは必ず環境変数で管理
- パフォーマンス: Claude APIのレスポンスタイムに注意
- コスト: API使用量を監視
- UX: ローディング状態を適切に表示

### 既知の制限事項
- 会話履歴は現在セッション内のみ（リロードで消失）
- ユーザー認証なし
- 同時接続数の制限（Cloud Runの設定による）

---

**最終更新**: 2025-12-27
**ステータス**: フェーズ11完了 - ドキュメント整備完了
