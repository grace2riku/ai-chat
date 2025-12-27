# コントリビューションガイド

AIチャットボットプロジェクトへのコントリビューションに興味を持っていただき、ありがとうございます！このドキュメントでは、プロジェクトへの貢献方法について説明します。

## 目次

- [行動規範](#行動規範)
- [はじめに](#はじめに)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [コントリビューションの方法](#コントリビューションの方法)
- [プルリクエストのガイドライン](#プルリクエストのガイドライン)
- [コーディング規約](#コーディング規約)
- [テストガイドライン](#テストガイドライン)
- [コミットメッセージ規約](#コミットメッセージ規約)

## 行動規範

このプロジェクトに参加するすべての人は、相互尊重と協力的な態度を持つことが期待されます。

### 推奨される行動

- 建設的なフィードバックを提供する
- 異なる視点や経験を尊重する
- 批判は技術的な内容に焦点を当てる
- コミュニティの改善に協力する

### 禁止される行動

- 攻撃的、侮辱的、または差別的な言動
- ハラスメントやトローリング
- 個人情報の無断公開
- プロジェクトの目的と無関係な宣伝

## はじめに

コントリビューションには以下のような形があります：

- バグ報告
- 機能提案
- ドキュメントの改善
- コードの改善（バグ修正、機能追加、リファクタリング）
- テストの追加・改善
- レビューとフィードバック

## 開発環境のセットアップ

### 必要なツール

- Node.js 20.x 以上
- npm
- Git
- Anthropic APIキー（テストを実行する場合）

### セットアップ手順

1. **リポジトリのフォーク**

GitHubでリポジトリをフォークします。

2. **リポジトリのクローン**

```bash
git clone https://github.com/YOUR_USERNAME/ai-chat.git
cd ai-chat
```

3. **依存関係のインストール**

```bash
npm install
# または
make init
```

4. **環境変数の設定**

```bash
cp .env.example .env.local
```

`.env.local`を編集して、必要な環境変数を設定：

```env
ANTHROPIC_API_KEY=your_api_key_here
```

5. **開発サーバーの起動**

```bash
npm run dev
# または
make dev
```

6. **テストの実行**

```bash
npm test
# または
make test
```

## コントリビューションの方法

### バグ報告

バグを見つけた場合は、GitHubのIssueで報告してください。

**良いバグレポートには以下が含まれます:**

- 明確で説明的なタイトル
- バグの再現手順
- 期待される動作
- 実際の動作
- スクリーンショット（該当する場合）
- 環境情報（OS、ブラウザ、Node.jsバージョンなど）

**バグレポートのテンプレート:**

```markdown
## バグの説明
簡潔で明確な説明

## 再現手順
1. '...'にアクセス
2. '....'をクリック
3. '....'まで下にスクロール
4. エラーを確認

## 期待される動作
何が起こるべきかの明確で簡潔な説明

## 実際の動作
実際に何が起こったかの説明

## スクリーンショット
該当する場合、スクリーンショットを追加

## 環境
- OS: [例: macOS 14.0]
- ブラウザ: [例: Chrome 120]
- Node.js: [例: 20.10.0]
- バージョン: [例: 0.1.0]
```

### 機能提案

新機能のアイデアがある場合は、GitHubのIssueで提案してください。

**良い機能提案には以下が含まれます:**

- 明確で説明的なタイトル
- 機能の詳細な説明
- なぜこの機能が有用なのか
- 可能であれば、実装案やモックアップ

### コードの貢献

1. **Issueを確認する**

既存のIssueを確認し、作業したいものを見つけるか、新しいIssueを作成します。

2. **ブランチを作成する**

```bash
git checkout -b feature/your-feature-name
# または
git checkout -b fix/your-bug-fix
```

ブランチ命名規則：
- 機能追加: `feature/機能名`
- バグ修正: `fix/バグ名`
- ドキュメント: `docs/ドキュメント名`
- リファクタリング: `refactor/対象名`
- テスト: `test/テスト名`

3. **コードを書く**

- コーディング規約に従う
- テストを追加・更新する
- ドキュメントを更新する（必要に応じて）

4. **テストを実行する**

```bash
npm test
npm run lint
```

5. **変更をコミットする**

```bash
git add .
git commit -m "feat: 新機能の追加"
```

6. **変更をプッシュする**

```bash
git push origin feature/your-feature-name
```

7. **プルリクエストを作成する**

GitHubでプルリクエストを作成します。

## プルリクエストのガイドライン

### プルリクエストを作成する前に

- [ ] コードがコーディング規約に従っている
- [ ] すべてのテストが通っている
- [ ] 新しい機能には適切なテストが含まれている
- [ ] ドキュメントが更新されている（必要に応じて）
- [ ] コミットメッセージが規約に従っている
- [ ] コンフリクトが解消されている

### プルリクエストの説明

**良いPR説明には以下が含まれます:**

```markdown
## 変更の概要
この変更の目的と内容を簡潔に説明

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] 破壊的変更
- [ ] ドキュメント更新
- [ ] リファクタリング
- [ ] パフォーマンス改善

## 関連Issue
Closes #123

## 変更の詳細
- 変更点1
- 変更点2
- 変更点3

## テスト方法
1. テスト手順1
2. テスト手順2
3. 期待される結果

## スクリーンショット
該当する場合、変更前後のスクリーンショット

## チェックリスト
- [ ] コードがコーディング規約に従っている
- [ ] テストが追加・更新されている
- [ ] すべてのテストが通っている
- [ ] ドキュメントが更新されている
```

### レビュープロセス

1. プルリクエストを作成すると、自動的にテストが実行されます
2. メンテナーがコードレビューを行います
3. 必要に応じて修正を依頼される場合があります
4. 承認されたら、メンテナーがマージします

## コーディング規約

### TypeScript

- TypeScriptの厳格モードを使用
- `any`型の使用は避ける
- 型定義を適切に使用する
- ESLintの警告を解消する

### React / Next.js

- 関数コンポーネントを使用
- Hooksを適切に使用
- コンポーネントは単一責任の原則に従う
- propsの型を明確に定義

### スタイリング

- Tailwind CSSを使用
- カスタムCSSは最小限に
- レスポンシブデザインを考慮

### ファイル構成

```
ai-chat/
├── app/                    # Next.js App Router
│   ├── api/               # APIルート
│   └── ...
├── components/            # Reactコンポーネント
├── lib/                   # ユーティリティ、ヘルパー
├── types/                 # TypeScript型定義
└── ...
```

### 命名規則

- **ファイル名**: PascalCase（コンポーネント）、camelCase（ユーティリティ）
- **コンポーネント名**: PascalCase
- **関数名**: camelCase
- **変数名**: camelCase
- **定数名**: UPPER_SNAKE_CASE
- **型名**: PascalCase

## テストガイドライン

### テストの原則

CLAUDE.mdのテストコード作成時の厳守事項を必ず守ってください。

#### 重要な原則

1. **意味のあるテストを書く**
   - `expect(true).toBe(true)`のような無意味なテストは禁止
   - 実際の機能を検証すること

2. **ハードコーディング禁止**
   - テストを通すためだけのハードコードは絶対に禁止
   - 本番コードに`if (testMode)`のような条件分岐を入れない

3. **カバレッジよりも品質**
   - 100%のカバレッジでも品質が保証されるわけではない
   - 重要なビジネスロジックを優先的にテスト

### テストの種類

#### 単体テスト

- コンポーネントテスト（React Testing Library）
- ユーティリティ関数のテスト
- APIルートのテスト

#### 統合テスト

- コンポーネント間の連携テスト
- APIとの統合テスト

### テストの書き方

**AAA (Arrange-Act-Assert) パターン**

```typescript
describe('Component', () => {
  it('should do something', () => {
    // Arrange: テストの準備
    const props = { /* ... */ };

    // Act: テスト対象の実行
    render(<Component {...props} />);

    // Assert: 結果の検証
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**Given-When-Then パターン**

```typescript
describe('sendMessage', () => {
  it('should return response when message is sent', async () => {
    // Given: 前提条件
    const message = 'Hello';

    // When: アクション
    const response = await sendMessage(message);

    // Then: 検証
    expect(response).toBeDefined();
    expect(response.timestamp).toBeTruthy();
  });
});
```

### テスト実行

```bash
# すべてのテストを実行
npm test

# watchモードで実行
npm run test:watch

# カバレッジを確認
npm test -- --coverage
```

## コミットメッセージ規約

### フォーマット

```
<type>: <subject>

<body>

<footer>
```

### Type

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマットなど）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

### 例

```bash
feat: Add image upload feature

- Add ImageUpload component
- Update ChatInterface to handle images
- Add image validation

Closes #42
```

```bash
fix: Fix message input not clearing after send

The message input was not being cleared after sending a message
due to missing state reset.

Fixes #38
```

## 質問やサポート

質問や不明点がある場合は、以下の方法でお問い合わせください：

- GitHubのIssueで質問を投稿
- Discussionsでコミュニティと議論

## ライセンス

コントリビューションを行うことで、あなたの貢献がMITライセンスの下でライセンスされることに同意したものとみなされます。

---

**ありがとうございます！**

皆様のコントリビューションがこのプロジェクトをより良いものにします。
