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

**最終更新:** 2025-12-19
**フェーズ1完了時点**
